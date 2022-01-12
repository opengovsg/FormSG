import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { isWeekend } from 'date-fns'

import { mockDateDecorator } from '~utils/storybook'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'

import FormErrorMessage from '../FormControl/FormErrorMessage'

import { DateInput, DateInputProps } from './DateInput'
import { DatePickerProps } from './DatePicker'

export default {
  title: 'Components/Date/DateInput',
  component: DateInput,
  decorators: [mockDateDecorator],
  parameters: {
    mockdate: new Date('2021-12-25T06:22:27.219Z'),
  },
} as Meta

const DatePickerOnlyTemplate: Story<DatePickerProps> = ({
  date,
  onSelectDate,
  ...args
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date)

  return (
    <DateInput.DatePicker
      date={selectedDate}
      onSelectDate={onSelectDate ?? setSelectedDate}
      {...args}
    />
  )
}

export const DatePickerDefault = DatePickerOnlyTemplate.bind({})

export const DatePickerWithDate = DatePickerOnlyTemplate.bind({})
DatePickerWithDate.args = {
  date: new Date('2001-01-01'),
}

export const DatePickerWeekdayOnly = DatePickerOnlyTemplate.bind({})
DatePickerWeekdayOnly.args = {
  isDateUnavailable: (d) => isWeekend(d),
}

const DateInputTemplate: Story<DateInputProps> = (args) => {
  return <DateInput {...args} />
}

export const DateInputDefault = DateInputTemplate.bind({})

const PlaygroundTemplate: Story<DateInputProps> = (args) => {
  const name = 'Date'
  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm()

  const onSubmit = useCallback((data: unknown) => {
    alert(JSON.stringify(data))
  }, [])

  const val = useWatch({ name, control })
  useEffect(() => console.log('val', val, typeof val), [val])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormControl isRequired isInvalid={!!errors[name]}>
        <FormLabel>Date</FormLabel>
        <Controller
          control={control}
          name={name}
          rules={{
            required: 'Date is required',
            validate: {
              // GET IT?
              validDate: (val) => {
                if (!val) return
                const dateVal = new Date(val)
                if (isNaN(dateVal.getTime())) {
                  return 'Please enter a valid date'
                }
                if (args.isDateUnavailable && args.isDateUnavailable(dateVal)) {
                  return 'Please enter an available date'
                }
                return true
              },
            },
          }}
          render={({ field }) => <DateInput {...field} {...args} />}
        />
        <FormErrorMessage>{errors[name]?.message}</FormErrorMessage>
      </FormControl>
      <Button type="submit">Submit</Button>
    </form>
  )
}

export const Playground = PlaygroundTemplate.bind({})
Playground.args = {
  isDateUnavailable: (d) => isWeekend(d),
}
