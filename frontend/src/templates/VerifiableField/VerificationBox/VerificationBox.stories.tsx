import { Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import { VerificationBox, VerificationBoxProps } from './VerificationBox'

export default {
  title: 'Templates/VerifiableField/VerificationBox',
  component: VerificationBox,
  decorators: [],
  args: {
    handleResendOtp: () => Promise.resolve(console.log('resending otp')),
    handleVfnSuccess: () => Promise.resolve(console.log('vfn success')),
  },
} as Meta<VerificationBoxProps>

const Template: Story<VerificationBoxProps> = (args) => (
  <VerificationBox {...args} />
)
export const MobileVerificationBox = Template.bind({})
MobileVerificationBox.args = {
  fieldType: BasicField.Mobile,
}

export const EmailVerificationBox = Template.bind({})
EmailVerificationBox.args = {
  fieldType: BasicField.Email,
}
