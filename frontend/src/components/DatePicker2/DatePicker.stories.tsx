import { Meta, Story } from '@storybook/react'

import { mockDateDecorator } from '~utils/storybook'

import { DatePicker, DatePickerProps } from './DatePicker'

export default {
  title: 'Components/DatePicker',
  component: DatePicker,
  decorators: [mockDateDecorator],
  parameters: {
    mockdate: new Date('2021-12-25T06:22:27.219Z'),
  },
} as Meta<DatePickerProps>

const Template: Story<DatePickerProps> = (args) => <DatePicker {...args} />
export const Default = Template.bind({})
Default.args = {}

export const DatePickerWithValue = Template.bind({})
DatePickerWithValue.args = {
  value: new Date('2001-01-01'),
}

export const DatePickerDisallowManualInput = Template.bind({})
DatePickerDisallowManualInput.args = {
  allowManualInput: false,
  value: new Date('2021-09-13'),
}
