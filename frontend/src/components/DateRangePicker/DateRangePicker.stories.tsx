import { Meta, Story } from '@storybook/react'

import { mockDateDecorator } from '~utils/storybook'

import { DateRangePicker, DateRangePickerProps } from './DateRangePicker'

export default {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  decorators: [mockDateDecorator],
  parameters: {
    mockdate: new Date('2021-12-25T06:22:27.219Z'),
  },
} as Meta<DateRangePickerProps>

const Template: Story<DateRangePickerProps> = (args) => (
  <DateRangePicker {...args} />
)
export const Default = Template.bind({})

export const DateRangePickerWithValue = Template.bind({})
DateRangePickerWithValue.args = {
  defaultValue: [new Date('2001-01-01'), null],
}

export const DateRangePickerDisallowManualInput = Template.bind({})
DateRangePickerDisallowManualInput.args = {
  allowManualInput: false,
  defaultValue: [new Date('2021-09-13'), null],
}
