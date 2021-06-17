import { Input, Select } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { Checkbox, CheckboxProps } from './Checkbox'

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
  decorators: [],
} as Meta

const Template: Story<CheckboxProps> = (args) => <Checkbox {...args} />
export const Default = Template.bind({})
Default.args = { options: ['Option 1', 'Option 2', 'Option 3'] }

export const OthersInput = Template.bind({})
OthersInput.args = {
  options: ['Option 1', 'Option 2', 'Option 3'],
  otherComponent: <Input placeholder="Please specify"></Input>, // TODO: replace with input component
}

export const OthersDropdown = Template.bind({})
OthersDropdown.args = {
  options: ['Option 1', 'Option 2', 'Option 3'],
  otherComponent: (
    <Select placeholder="Select option">
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
      <option value="option3">Option 3</option>
    </Select>
  ), // TODO: replace with dropdown component
}
