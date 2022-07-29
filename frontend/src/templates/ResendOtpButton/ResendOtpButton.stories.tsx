import { Meta, Story } from '@storybook/react'

import { ResendOtpButton, ResendOtpButtonProps } from './ResendOtpButton'
import {
  ResendOtpButtonContainer,
  ResendOtpButtonContainerProps,
} from './ResendOtpButtonContainer'

export default {
  title: 'Templates/Button/ResendOtpButton',
  component: ResendOtpButton,
  decorators: [],
} as Meta

const Template: Story<ResendOtpButtonProps> = (args) => (
  <ResendOtpButton {...args} />
)
export const Default = Template.bind({})
Default.args = {}

export const Loading = Template.bind({})
Loading.args = {
  isLoading: true,
}

export const InProgress = Template.bind({})
InProgress.args = {
  timer: 30,
  isDisabled: true,
}

export const Playground: Story<ResendOtpButtonContainerProps> = (args) => (
  <ResendOtpButtonContainer {...args} />
)
Playground.args = {
  onResendOtp: () => new Promise((res) => setTimeout(res, 800)),
}
