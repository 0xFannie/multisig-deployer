import { Resend } from 'resend'

// 仅在服务端使用，确保 API 密钥安全
const resendApiKey = process.env.RESEND_API_KEY
if (!resendApiKey && typeof window === 'undefined') {
  console.warn('RESEND_API_KEY is not configured. Email functionality will be disabled.')
}
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendVerificationEmail(email: string, code: string) {
  if (!resend) {
    console.error('Resend client not initialized. RESEND_API_KEY is missing.')
    return { success: false, error: new Error('Email service not configured') }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Chain Tools <noreply@chain-tools.com>',
      to: email,
      subject: 'Verify Your Email - Chain Tools',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Email Verification</h1>
                      <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Chain Tools</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Thank you for using Chain Tools. To complete your email verification, please use the verification code below:
                      </p>
                      
                      <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; border: 2px solid #d1d5db;">
                        <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #111827; font-family: 'Courier New', monospace;">
                          ${code}
                        </div>
                      </div>
                      
                      <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                        This verification code will expire in <strong>10 minutes</strong>.
                      </p>
                      
                      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 6px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                          <strong>Security Tip:</strong> Never share this code with anyone. Chain Tools will never ask for your verification code via email or phone.
                        </p>
                      </div>
                      
                      <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If you didn't request this verification code, please ignore this email or contact our support team.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                        This is an automated email from Chain Tools.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} Chain Tools. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error }
  }
}

interface ApprovalNotificationParams {
  to: string
  contractAddress: string
  network: string
  txIndex: number
  toAddress: string
  value: string
  assetType: string
  submittedBy: string
  explorerUrl?: string
}

export async function sendApprovalNotificationEmail(params: ApprovalNotificationParams) {
  if (!resend) {
    console.error('Resend client not initialized. RESEND_API_KEY is missing.')
    return { success: false, error: new Error('Email service not configured') }
  }

  try {
    const {
      to,
      contractAddress,
      network,
      txIndex,
      toAddress,
      value,
      assetType,
      submittedBy,
      explorerUrl
    } = params

    // 格式化金额
    const formatValue = (val: string, type: string) => {
      const num = parseFloat(val)
      if (type === 'native') {
        return `${num.toFixed(4)} ${network === 'polygon' ? 'POL' : network === 'bsc' ? 'BNB' : 'ETH'}`
      }
      return `${num.toFixed(2)} ${type.toUpperCase()}`
    }

    const formattedValue = formatValue(value, assetType)
    const shortContract = `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`
    const shortTo = `${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`
    const shortSubmittedBy = `${submittedBy.slice(0, 6)}...${submittedBy.slice(-4)}`

    const { data, error } = await resend.emails.send({
      from: 'Chain Tools <noreply@chain-tools.com>',
      to,
      subject: `Action Required: Approve Multi-Signature Transaction #${txIndex}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Action Required: Approve Transaction</h1>
                      <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Multi-Signature Wallet Transaction Approval</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        A new transaction has been submitted to your multi-signature wallet and requires your approval. Please review the details below and take appropriate action.
                      </p>
                      
                      <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 24px; margin: 30px 0; border-radius: 8px;">
                        <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">Transaction Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 14px; width: 140px;">Transaction #:</td>
                            <td style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600;">${txIndex}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Contract Address:</td>
                            <td style="padding: 12px 0; color: #111827; font-family: 'Courier New', monospace; font-size: 14px;">${shortContract}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Network:</td>
                            <td style="padding: 12px 0; color: #111827; font-size: 14px; text-transform: capitalize; font-weight: 600;">${network}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Recipient Address:</td>
                            <td style="padding: 12px 0; color: #111827; font-family: 'Courier New', monospace; font-size: 14px;">${shortTo}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Transfer Amount:</td>
                            <td style="padding: 12px 0; color: #111827; font-size: 16px; font-weight: 700; color: #059669;">${formattedValue}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-weight: 600; font-size: 14px;">Submitted By:</td>
                            <td style="padding: 12px 0; color: #111827; font-family: 'Courier New', monospace; font-size: 14px;">${shortSubmittedBy}</td>
                          </tr>
                        </table>
                      </div>

                      ${explorerUrl ? `
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${explorerUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                          View Transaction on Explorer
                        </a>
                      </div>
                      ` : ''}

                      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                          <span style="font-size: 24px;">⚠️</span>
                          <h3 style="margin: 0; color: #92400e; font-size: 18px; font-weight: 600;">Action Required</h3>
                        </div>
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                          Please review and approve this transaction in the Chain Tools application. The transaction cannot be executed until it receives the required number of approvals.
                        </p>
                      </div>

                      <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">Next Steps:</p>
                        <ol style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                          <li>Log in to your Chain Tools account</li>
                          <li>Navigate to the Transaction Management section</li>
                          <li>Review the transaction details carefully</li>
                          <li>Approve the transaction if it looks correct</li>
                        </ol>
                      </div>

                      <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        This is an automated notification from Chain Tools. Please do not reply to this email. If you have any questions or concerns, please contact our support team.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                        This is an automated email from Chain Tools.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} Chain Tools. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Approval notification email send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Approval notification email send exception:', error)
    return { success: false, error }
  }
}

