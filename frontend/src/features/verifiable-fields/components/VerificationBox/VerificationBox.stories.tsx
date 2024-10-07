import { Meta, StoryFn } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import { viewports } from '~utils/storybook'

import { VerificationBox, VerificationBoxProps } from './VerificationBox'

export default {
  title: 'Features/VerifiableField/VerificationBox',
  component: VerificationBox,
  decorators: [],
  args: {
    handleResendOtp: () => Promise.resolve(console.log('resending otp')),
    handleVfnSuccess: () => Promise.resolve(console.log('vfn success')),
    handleVerifyOtp: () => Promise.resolve('some-mock-signature'),
  },
} as Meta<VerificationBoxProps>

const Template: StoryFn<VerificationBoxProps> = (args) => (
  <VerificationBox {...args} />
)
export const MobileVerificationBox = Template.bind({})
MobileVerificationBox.args = {
  fieldType: BasicField.Mobile,
}

export const MobileVerificationBoxMobile = Template.bind({})
MobileVerificationBoxMobile.args = {
  fieldType: BasicField.Mobile,
}
MobileVerificationBoxMobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const EmailVerificationBox = Template.bind({})
EmailVerificationBox.args = {
  fieldType: BasicField.Email,
}

export const EmailVerificationBoxMobile = Template.bind({})
EmailVerificationBoxMobile.args = {
  fieldType: BasicField.Email,
}
EmailVerificationBoxMobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
