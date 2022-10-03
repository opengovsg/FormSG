import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
} from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { mockDateDecorator } from '~utils/storybook'

import { DateRangeInput, DateRangeInputProps } from './DateRangeInput'
import { DateRangePicker, DateRangePickerProps } from './DateRangePicker'

export default {
  title: 'Components/Date/DateRangeInput',
  component: DateRangeInput,
  decorators: [mockDateDecorator],
  parameters: {
    mockdate: new Date('2021-12-25T06:22:27.219Z'),
  },
} as Meta

const PickerOnlyTemplate: Story<DateRangePickerProps> = (args) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>(
    args.selectedDates ?? [],
  )
  const [hoveredDate, setHoveredDate] = useState<Date>()

  const handleOnDateSelected = (date: Date) => {
    const newDates = [...selectedDates]
    if (selectedDates.length) {
      if (selectedDates.length === 1) {
        const firstTime = selectedDates[0]
        if (firstTime < date) {
          newDates.push(date)
        } else {
          newDates.unshift(date)
        }
        setSelectedDates(newDates)
      } else if (newDates.length === 2) {
        setSelectedDates([date])
      }
    } else {
      newDates.push(date)
      setSelectedDates(newDates)
    }
  }

  const isDateInRange = useCallback(
    (date: Date) => {
      if (!selectedDates?.length) {
        return false
      }
      const firstSelected = selectedDates[0]
      if (selectedDates.length === 2) {
        const secondSelected = selectedDates[1]
        return firstSelected < date && secondSelected > date
      } else {
        return (
          !!hoveredDate &&
          ((firstSelected < date && hoveredDate >= date) ||
            (date < firstSelected && date >= hoveredDate))
        )
      }
    },
    [hoveredDate, selectedDates],
  )

  const onMouseEnterHighlight = useCallback(
    (date: Date) => {
      if (!selectedDates?.length) {
        return
      }
      setHoveredDate(date)
    },
    [selectedDates?.length],
  )

  const onMouseLeaveCalendar = useCallback(() => {
    setHoveredDate(undefined)
  }, [])

  return (
    <DateRangePicker
      onMouseEnterHighlight={onMouseEnterHighlight}
      onMouseLeaveCalendar={onMouseLeaveCalendar}
      isDateInRange={isDateInRange}
      selectedDates={selectedDates}
      hoveredDate={hoveredDate}
      onSelectDate={handleOnDateSelected}
    />
  )
}
export const PickerOnly = PickerOnlyTemplate.bind({})
PickerOnly.args = {}

export const PickerWithDate = PickerOnlyTemplate.bind({})
PickerWithDate.args = {
  selectedDates: [new Date('2001-01-01'), new Date('2001-02-08')],
}

const PlaygroundTemplate: Story<DateRangeInputProps> = (args) => {
  const name = 'Date'
  const {
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm()

  const onSubmit = useCallback((data: unknown) => {
    alert(JSON.stringify(data))
  }, [])

  const val = watch(name)
  useEffect(() => console.log('val', val), [val])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl isRequired isInvalid={!!errors[name]}>
        <FormLabel>Date</FormLabel>
        <Controller
          control={control}
          name={name}
          rules={{
            required: 'Date is required',
          }}
          render={({ field }) => <DateRangeInput {...field} />}
        />
        <FormErrorMessage>{errors[name]?.message}</FormErrorMessage>
      </FormControl>
      <Button type="submit">Submit</Button>
    </form>
  )
}

export const Playground = PlaygroundTemplate.bind({})
