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
        <Text>You are currently submitting a form on {appName}.</Text>
        <Text>
          Your OTP is {otpPrefix}-<b>{otp}</b>. It will expire in{' '}
          {minutesToExpiry} minutes. Please use this to verify your submission.
        </Text>
        <Text>
          Never share your OTP with anyone else. If you did not request this
          OTP, you can safely ignore this email.
        </Text>
        <Text>The {appName} Support Team</Text>
      </Body>
    </Html>
  )
}
