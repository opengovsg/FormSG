import { Meta, Story } from '@storybook/react'

import { Input, InputProps } from './Input'

export default {
  title: 'Components/Input',
  component: Input,
  decorators: [],
} as Meta

const Template: Story<InputProps> = (args) => <Input {...args} />
export const Default = Template.bind({})
Default.args = {
  placeholder: 'Test placeholder',
}

export const Error = Template.bind({})
Error.args = {
  isInvalid: true,
}
export const Disabled = Template.bind({})
Disabled.args = {
  value: 'Some text',
  isDisabled: true,
}
