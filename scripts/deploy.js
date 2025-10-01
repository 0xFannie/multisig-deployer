const hre = require("hardhat");

async function main() {
  console.log("开始部署多签钱包合约...\n");

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 配置多签钱包参数
  // 注意：在生产环境中，这些应该从命令行参数或配置文件读取
  const owners = [
    deployer.address,
    // 添加其他所有者地址
    // "0x...",
    // "0x...",
  ];
  
  const numConfirmationsRequired = 1; // 需要的确认数

  console.log("多签钱包配置:");
  console.log("- 所有者数量:", owners.length);
  console.log("- 所有者地址:", owners);
  console.log("- 所需确认数:", numConfirmationsRequired);
  console.log();

  // 验证参数
  if (owners.length === 0) {
    throw new Error("至少需要一个所有者地址");
  }
  if (numConfirmationsRequired > owners.length) {
    throw new Error("所需确认数不能大于所有者数量");
  }

  // 部署合约
  console.log("正在部署 MultiSigWallet 合约...");
  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
  const multiSigWallet = await MultiSigWallet.deploy(owners, numConfirmationsRequired);

  await multiSigWallet.waitForDeployment();

  const contractAddress = await multiSigWallet.getAddress();
  console.log("✅ MultiSigWallet 合约已部署到:", contractAddress);
  console.log();

  // 验证部署
  console.log("验证合约部署...");
  const deployedOwners = await multiSigWallet.getOwners();
  const deployedRequired = await multiSigWallet.numConfirmationsRequired();
  
  console.log("- 已部署的所有者:", deployedOwners);
  console.log("- 已部署的所需确认数:", deployedRequired.toString());
  console.log();

  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    owners: deployedOwners,
    numConfirmationsRequired: deployedRequired.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  console.log("📋 部署摘要:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log();

  // 如果在测试网或主网，提供区块链浏览器链接
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    const explorerUrls = {
      mainnet: "https://etherscan.io",
      sepolia: "https://sepolia.etherscan.io",
      polygon: "https://polygonscan.com",
      mumbai: "https://mumbai.polygonscan.com",
      bsc: "https://bscscan.com",
      bscTestnet: "https://testnet.bscscan.com",
      arbitrum: "https://arbiscan.io"
    };

    const explorerUrl = explorerUrls[hre.network.name];
    if (explorerUrl) {
      console.log(`🔗 在区块链浏览器查看: ${explorerUrl}/address/${contractAddress}`);
      console.log();
      
      // 提示验证合约
      console.log("💡 要验证合约，运行:");
      console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} '${JSON.stringify(owners)}' ${numConfirmationsRequired}`);
    }
  }

  console.log("\n✨ 部署完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });

