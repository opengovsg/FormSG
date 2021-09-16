import { Meta, Story } from '@storybook/react'

import { DatePicker } from './DatePicker'

export default {
  title: 'Components/DatePicker',
  component: DatePicker,
} as Meta

const Template: Story = () => {
  return <DatePicker />
}

export const Default = Template.bind({})
