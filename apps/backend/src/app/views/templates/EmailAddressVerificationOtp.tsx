import { Body, Head, Html, Text, Link } from '@react-email/components'

export type EmailAddressVerificationOtpHtmlData = {
  otpPrefix: string
  otp: string
  minutesToExpiry: number
  appName: string
}

export const EmailAddressVerificationOtp = ({
  otpPrefix,
  otp,
  minutesToExpiry,
  appName,
}: EmailAddressVerificationOtpHtmlData): JSX.Element => {
  return (
    <Html>
      <Head />
      <Body>
        <Text>
          You are currently submitting a form and verifying your email address
          on {appName}.
        </Text>
        <Text style={{ fontWeight: 600 }}>
          If you did not personally request for this OTP, you may be a victim of
          scam. Do NOT share this OTP with anyone. Government officials will
          never ask for OTP information from you.
        </Text>
        <Text>---</Text>
        <Text>
          Your email OTP is {otpPrefix}-<b>{otp}</b>. It will expire in{' '}
          {minutesToExpiry} minutes. Please use this to verify your submission.
        </Text>
        <Text>The {appName} Support Team</Text>
      </Body>
    </Html>
  )
}
