/**
 * Generates a professional, responsive HTML email template for OTP login.
 * Uses inline CSS for maximum compatibility with email clients.
 */
export function getOtpEmailTemplate(code: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your SchoolConnect Login Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #111827;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">SchoolConnect AI</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Hello,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #374151;">
                Please use the following verification code to securely log in to your account. This code will expire in <strong>10 minutes</strong>.
              </p>
              
              <!-- OTP Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <div style="background-color: #eff6ff; border: 2px dashed #93c5fd; border-radius: 8px; padding: 16px 32px; display: inline-block;">
                      <span style="font-size: 32px; font-weight: 800; letter-spacing: 0.2em; color: #1e3a8a;">${code}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                If you did not request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} SchoolConnect AI. All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates the plain text version of the OTP email.
 */
export function getOtpEmailText(code: string): string {
  return `Your SchoolConnect AI verification code is ${code}. It expires in 10 minutes. If you didn't request this, please ignore this email.`;
}

/**
 * Generates the standardized SMS message for OTP login.
 * Keeping it extremely concise to save on SMS segment costs.
 */
export function getOtpSmsTemplate(code: string): string {
  return `[${code}] is your SchoolConnect login code. Valid for 10m. Do not share it.`;
}
