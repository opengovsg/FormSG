import { useControllableState } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { isWeekend } from 'date-fns'

import { mockDateDecorator } from '~utils/storybook'

import { Calendar, CalendarProps } from './Calendar'

export default {
  title: 'Components/Calendar/Calendar',
  component: Calendar,
  decorators: [mockDateDecorator],
  parameters: {
    layout: 'fullscreen',
    mockdate: new Date('2021-12-25T06:22:27.219Z'),
  },
} as Meta<CalendarProps>

const CalendarOnlyTemplate: Story<CalendarProps> = ({
  value,
  onChange,
  ...args
}) => {
  const [internalValue, setInternalValue] = useControllableState({
    value,
    onChange,
  })

  return (
    <Calendar value={internalValue} onChange={setInternalValue} {...args} />
  )
}

export const Default = CalendarOnlyTemplate.bind({})

export const CalendarWithValue = CalendarOnlyTemplate.bind({})
CalendarWithValue.args = {
  value: new Date('2001-01-01'),
}

export const CalendarWeekdayOnly = CalendarOnlyTemplate.bind({})
CalendarWeekdayOnly.args = {
  isDateUnavailable: (d) => isWeekend(d),
}
