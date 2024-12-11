import { Meta, StoryFn } from '@storybook/react'

import EmailAddressVerificationOtp, {
  type EmailAddressVerificationOtpHtmlData,
} from './EmailAddressVerificationOtp'

export default {
  title: 'EmailPreview/EmailAddressVerificationOtp',
  component: EmailAddressVerificationOtp,
  decorators: [],
} as Meta

const Template: StoryFn<EmailAddressVerificationOtpHtmlData> = (args) => (
  <EmailAddressVerificationOtp {...args} />
)

export const Default = Template.bind({})
Default.args = {
  otpPrefix: 'ABC',
  otp: '123456',
  minutesToExpiry: 30,
  appName: 'FormSG',
}
