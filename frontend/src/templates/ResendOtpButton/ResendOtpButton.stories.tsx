import { Meta, Story } from '@storybook/react'

import { ResendOtpButton, ResendOtpButtonProps } from './ResendOtpButton'
import { ResendOtpButtonContainer } from './ResendOtpButtonContainer'

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

export const Playground = () => (
  <ResendOtpButtonContainer
    timer={0}
    onResendOtp={() => new Promise((res) => setTimeout(res, 800))}
  />
)
