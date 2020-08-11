import dedent from 'dedent-js'

export const generateLoginOtpHtml = ({
  otp,
  appName,
  appUrl,
}: {
  otp: string
  appName: string
  appUrl: string
}) => {
  return dedent`
    <p>
      Your OTP is <b>${otp}</b>. Please use this to login to 
      your ${appName} account.
    </p>
    <p>If your OTP does not work, please request for a new OTP at ${appUrl}.</p>
    <br />
    <p>If you did not make this request, you may ignore this email.</p>
    <br />
    <p>The ${appName} Support Team</p>
  `
}

export const generateVerificationOtpHtml = ({
  otp,
  appName,
  minutesToExpiry,
}: {
  otp: string
  appName: string
  minutesToExpiry: number
}) => {
  return dedent`
    <p>You are currently submitting a form on ${appName}.</p>
    <p>
      Your OTP is <b>${otp}</b>. It will expire in ${minutesToExpiry} minutes. 
      Please use this to verify your submission.
    </p>
    <p>If your OTP does not work, please request for a new OTP.</p>
    <br />
    <p>If you did not make this request, you may ignore this email.</p>
    <br />
    <p>The ${appName} Support Team</p>
  `
}
