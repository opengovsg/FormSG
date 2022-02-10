import { Meta, Story } from '@storybook/react'

import { SingleSelect, SingleSelectProps } from './SingleSelect'

export default {
  title: 'Components/SingleSelect',
  component: SingleSelect,
  decorators: [],
} as Meta

const Template: Story<SingleSelectProps> = (args) => <SingleSelect {...args} />

export const Default = Template.bind({})
Default.args = {
  items: [],
  onValueChange: (value) => console.log(value),
  selectedValue: '',
}
