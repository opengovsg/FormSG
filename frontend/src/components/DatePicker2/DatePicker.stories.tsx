import { Meta, Story } from '@storybook/react'

import { DatePicker, DatePickerProps } from './DatePicker'

export default {
  title: 'Components/DatePicker',
  component: DatePicker,
  decorators: [],
} as Meta<DatePickerProps>

const Template: Story<DatePickerProps> = (args) => <DatePicker {...args} />
export const Default = Template.bind({})
Default.args = {}
