import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../../lib/supabase'
import { createPublicClient, http } from 'viem'
import { 
  mainnet, 
  polygon, 
  bsc, 
  arbitrum, 
  optimism, 
  avalanche, 
  fantom, 
  base, 
  linea,
  zkSync,
  scroll,
  polygonZkEvm,
  sepolia,
  goerli
} from 'wagmi/chains'
import MultiSigWalletABI from '../../../artifacts/contracts/MultiSigWallet.sol/MultiSigWallet.json'

// 网络名称到 chainId 的映射
const NETWORK_TO_CHAIN_ID: Record<string, number> = {
  'Ethereum': mainnet.id,
  'Polygon': polygon.id,
  'BNB Chain': bsc.id,
  'Avalanche': avalanche.id,
  'Fantom': fantom.id,
  'Arbitrum One': arbitrum.id,
  'Optimism': optimism.id,
  'Base': base.id,
  'zkSync Era': zkSync.id,
  'Scroll': scroll.id,
  'Polygon zkEVM': polygonZkEvm.id,
  'Linea': linea.id,
  'Sepolia': sepolia.id,
  'Goerli': goerli.id,
}

// 获取网络对应的 chain 配置
function getChainForNetwork(networkName: string) {
  const chainId = NETWORK_TO_CHAIN_ID[networkName]
  if (!chainId) return null

  const chains: Record<number, any> = {
    [mainnet.id]: mainnet,
    [polygon.id]: polygon,
    [bsc.id]: bsc,
    [avalanche.id]: avalanche,
    [fantom.id]: fantom,
    [arbitrum.id]: arbitrum,
    [optimism.id]: optimism,
    [base.id]: base,
    [zkSync.id]: zkSync,
    [scroll.id]: scroll,
    [polygonZkEvm.id]: polygonZkEvm,
    [linea.id]: linea,
    [sepolia.id]: sepolia,
    [goerli.id]: goerli,
  }

  return chains[chainId] || null
}

// 从链上读取合约信息并创建部署记录
async function createDeploymentFromChain(
  contractAddress: string,
  network: string,
  userId: string,
  submittedBy: string
) {
  console.log('Creating deployment from chain:', { contractAddress, network, userId })
  
  const chain = getChainForNetwork(network)
  if (!chain) {
    throw new Error(`Unsupported network: ${network}`)
  }

  console.log('Chain configuration found:', { chainId: chain.id, name: chain.name })

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  })

  // 从链上读取合约信息
  let owners: string[] = []
  let threshold: bigint = 0n
  
  try {
    console.log('Reading contract info from chain...')
    const results = await Promise.all([
      publicClient.readContract({
        address: contractAddress.toLowerCase() as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'getOwners',
      }) as Promise<string[]>,
      publicClient.readContract({
        address: contractAddress.toLowerCase() as `0x${string}`,
        abi: MultiSigWalletABI.abi,
        functionName: 'numConfirmationsRequired',
      }) as Promise<bigint>,
    ])
    
    owners = results[0]
    threshold = results[1]
    
    console.log('Contract info read from chain:', {
      ownersCount: owners.length,
      threshold: Number(threshold),
      owners: owners
    })
  } catch (readError: any) {
    console.error('Failed to read contract from chain:', readError)
    console.error('Error details:', {
      message: readError?.message,
      code: readError?.code,
      name: readError?.name,
      stack: readError?.stack
    })
    throw new Error(`Failed to read contract from chain: ${readError?.message || 'Unknown error'}`)
  }

  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  // 创建部署记录
  console.log('Inserting deployment record to database...')
  
  // 确保 owners 是数组格式，并且所有地址都是小写（适配 text[] 类型）
  const ownersArray: string[] = Array.isArray(owners) 
    ? owners.map((addr: string) => addr.toLowerCase())
    : [String(owners).toLowerCase()]
  
  console.log('Deployment data to insert:', {
    user_id: userId,
    contract_address: contractAddress.toLowerCase(),
    network,
    contract_type: 'MultiSigWallet',
    owners: ownersArray,
    ownersCount: ownersArray.length,
    threshold: Number(threshold),
  })
  
  const deploymentData: any = {
    user_id: userId,
    contract_address: contractAddress.toLowerCase(),
    network,
    contract_type: 'MultiSigWallet',
    owners: ownersArray, // text[] 类型，Supabase 会自动处理数组
    threshold: Number(threshold),
  }
  
  console.log('Calling Supabase insert...')
  const { data: deployment, error: createError } = await supabaseAdmin
    .from('multisig_deployments')
    .insert([deploymentData])
    .select()
    .single()
  
  console.log('Supabase insert response:', {
    hasData: !!deployment,
    hasError: !!createError,
    dataId: deployment?.id,
    errorCode: createError?.code,
    errorMessage: createError?.message,
  })

  if (createError) {
    console.error('Failed to create deployment record:', createError)
    console.error('Error details:', {
      code: createError.code,
      message: createError.message,
      details: createError.details,
      hint: createError.hint,
      contractAddress: contractAddress.toLowerCase(),
      network,
      userId,
      ownersCount: owners.length,
      threshold: Number(threshold)
    })
    throw new Error(`Failed to create deployment record: ${createError.message || 'Unknown error'}`)
  }

  if (!deployment) {
    console.error('Deployment insert returned no data')
    throw new Error('Deployment insert returned no data')
  }

  console.log('Created deployment record from chain data:', deployment.id)
  return deployment
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Submit transaction request received:', {
      method: req.method,
      bodyKeys: Object.keys(req.body || {}),
      userId: req.body?.userId,
      contractAddress: req.body?.contractAddress,
    })

    const {
      userId,
      contractAddress,
      network,
      txIndex,
      to,
      value,
      assetType, // 'native', 'usdt', 'usdc', etc.
      assetAddress, // token contract address if not native
      submittedBy,
      transactionHash,
      expirationTime // optional Unix timestamp in seconds
    } = req.body

    if (!userId || !contractAddress || !network || txIndex === undefined || !to || !value || !submittedBy || !transactionHash) {
      console.error('Missing required fields:', {
        userId: !!userId,
        contractAddress: !!contractAddress,
        network: !!network,
        txIndex: txIndex !== undefined,
        to: !!to,
        value: !!value,
        submittedBy: !!submittedBy,
        transactionHash: !!transactionHash,
      })
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!supabaseAdmin) {
      console.error('supabaseAdmin is not configured')
      return res.status(500).json({ error: 'Database not configured' })
    }

    // 获取合约信息
    console.log('Fetching deployment for contract:', contractAddress.toLowerCase())
    let { data: deployment, error: deploymentError } = await supabaseAdmin
      .from('multisig_deployments')
      .select('*')
      .eq('contract_address', contractAddress.toLowerCase())
      .maybeSingle()

    if (deploymentError) {
      console.error('Deployment fetch error:', deploymentError)
      console.error('Error details:', {
        code: deploymentError.code,
        message: deploymentError.message,
        details: deploymentError.details,
        hint: deploymentError.hint
      })
      return res.status(500).json({ 
        error: 'Database error', 
        details: deploymentError.message 
      })
    }

    // 如果数据库中没有部署记录，尝试从链上读取并创建
    if (!deployment) {
      console.log('⚠️ Deployment not found in database, attempting to fetch from chain:', contractAddress)
      console.log('Request details:', {
        contractAddress,
        network,
        userId,
        submittedBy
      })
      
      try {
        // 尝试从链上读取合约信息并创建部署记录
        console.log('🔄 Starting createDeploymentFromChain...')
        deployment = await createDeploymentFromChain(
          contractAddress,
          network,
          userId,
          submittedBy
        )
        console.log('✅ Successfully created deployment record from chain data:', deployment?.id)
      } catch (chainError: any) {
        console.error('❌ Failed to create deployment from chain:', chainError)
        console.error('Chain error details:', {
          message: chainError?.message,
          code: chainError?.code,
          name: chainError?.name,
          stack: chainError?.stack,
          cause: chainError?.cause
        })
        return res.status(404).json({ 
          error: 'Contract not found',
          details: `No deployment found for contract address: ${contractAddress}. Failed to read from chain: ${chainError?.message || 'Unknown error'}`,
          debug: {
            network,
            contractAddress,
            errorType: chainError?.name,
            errorCode: chainError?.code
          }
        })
      }
    }

    console.log('Deployment found:', { id: deployment.id, threshold: deployment.threshold })

    // 检查收款人是否在白名单中
    let isWhitelisted = false
    if (supabaseAdmin && userId) {
      const { data: whitelist, error: whitelistError } = await supabaseAdmin
        .from('recipient_whitelist')
        .select('id')
        .eq('user_id', userId)
        .eq('recipient_address', to.toLowerCase())
        .maybeSingle()
      
      if (whitelistError) {
        console.error('Whitelist check error:', whitelistError)
        // 不阻止交易，只是记录错误
      } else {
        isWhitelisted = !!whitelist
      }
    }

    // 创建交易记录
    console.log('Inserting transaction record:', {
      userId,
      deployment_id: deployment.id,
      contract_address: contractAddress.toLowerCase(),
      network,
      tx_index: txIndex,
      to_address: to.toLowerCase(),
      value: value.toString(),
      asset_type: assetType,
      asset_address: assetAddress || null,
      submitted_by: submittedBy.toLowerCase(),
      transaction_hash: transactionHash,
      status: 'pending',
      current_confirmations: 0,
      required_confirmations: deployment.threshold,
      is_whitelisted_recipient: isWhitelisted
    })

    const { data: transactions, error: txError } = await supabaseAdmin
      .from('multisig_transactions')
      .insert([{
        user_id: userId,
        deployment_id: deployment.id,
        contract_address: contractAddress.toLowerCase(),
        network,
        tx_index: txIndex,
        to_address: to.toLowerCase(),
        value: value.toString(),
        asset_type: assetType,
        asset_address: assetAddress || null,
        submitted_by: submittedBy.toLowerCase(),
        transaction_hash: transactionHash,
        status: 'pending',
        current_confirmations: 0,
        required_confirmations: deployment.threshold,
        is_whitelisted_recipient: isWhitelisted,
        expiration_time: expirationTime ? new Date(Number(expirationTime) * 1000).toISOString() : null
      }])
      .select()

    if (txError) {
      console.error('Transaction insert error:', txError)
      console.error('Error details:', {
        code: txError.code,
        message: txError.message,
        details: txError.details,
        hint: txError.hint
      })
      throw txError
    }

    if (!transactions || transactions.length === 0) {
      console.error('Transaction insert returned no data')
      return res.status(500).json({ 
        error: 'Failed to create transaction record',
        details: 'Transaction insert returned no data'
      })
    }

    const transaction = transactions[0]
    console.log('Transaction inserted successfully:', transaction?.id)

    // 记录活动
    try {
      if (supabaseAdmin) {
        await supabaseAdmin.from('activity_logs').insert([{
          user_id: userId,
          action: 'transaction_submitted',
          metadata: {
            contractAddress,
            txIndex,
            to,
            value,
            transactionHash
          }
        }])
      }
    } catch (logError) {
      console.error('Failed to log activity:', logError)
      // 不阻止成功，因为交易已经记录
    }

    return res.status(200).json({
      success: true,
      transaction
    })
  } catch (error: any) {
    console.error('Submit transaction error:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack
    })
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || String(error)
    })
  }
}

