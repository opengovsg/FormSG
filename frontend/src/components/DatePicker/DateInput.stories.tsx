import { useCallback, useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { isWeekend } from 'date-fns'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'

import FormErrorMessage from '../FormControl/FormErrorMessage'

import { DateInput, DateInputProps } from './DateInput'
import { DatePickerProps } from './DatePicker'

export default {
  title: 'Components/DateInput',
  component: DateInput,
} as Meta

const DatePickerOnlyTemplate: Story<DatePickerProps> = (args) => {
  return <DateInput.DatePicker {...args} />
}

export const DatePickerDefault = DatePickerOnlyTemplate.bind({})

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
  useEffect(() => console.log('val', val), [val])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isRequired>
        <FormLabel>Date</FormLabel>
        <Controller
          control={control}
          name={name}
          render={({ field }) => <DateInput {...field} />}
        />
        <FormErrorMessage>{errors[name]?.message}</FormErrorMessage>
      </FormControl>
      <Button type="submit">Submit</Button>
    </form>
  )
}

export const Playground = PlaygroundTemplate.bind({})
