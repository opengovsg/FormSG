import { Input } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { Radio, RadioProps } from './Radio'

export default {
  title: 'Components/Radio',
  component: Radio,
  decorators: [],
} as Meta

const Template: Story<RadioProps> = (args) => <Radio {...args} />
export const Default = Template.bind({})
Default.args = { options: ['Option 1', 'Option 2', 'Option 3'] }

export const Others = Template.bind({})
Others.args = {
  options: ['Option 1', 'Option 2', 'Option 3'],
  other: true,
}
