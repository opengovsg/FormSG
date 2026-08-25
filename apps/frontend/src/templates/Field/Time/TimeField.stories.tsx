import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { BasicField } from 'formsg-shared/types/field'

import Button from '~components/Button'

import { TimeFieldSchema } from '../types'

import { TimeField as TimeFieldComponent, TimeFieldProps } from './TimeField'

export default {
  title: 'Templates/Field/TimeField',
  component: TimeFieldComponent,
  decorators: [],
  parameters: {
    docs: {
      // Required in this story due to react-hook-form conflicting with
      // Storybook somehow.
      // See https://github.com/storybookjs/storybook/issues/12747.
      source: { type: 'code' },
    },
  },
} as Meta

const baseSchema: TimeFieldSchema = {
  title: 'What time did it happen?',
  description: 'The value submitted is always 24-hour HH:MM:SS.',
  required: true,
  disabled: false,
  fieldType: BasicField.Time,
  _id: '611b94dfbb9e300012f702a8',
  questionNumber: 1,
  includeSeconds: false,
  use24HourFormat: true,
}

interface StoryTimeFieldProps extends TimeFieldProps {
  defaultValue?: string
}

const Template: StoryFn<StoryTimeFieldProps> = ({ defaultValue, ...args }) => {
  const formMethods = useForm({
    defaultValues: { [args.schema._id]: defaultValue },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string | undefined>) => {
    setSubmitValues(values[args.schema._id] || 'Nothing was entered')
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <TimeFieldComponent {...args} />
        <Button mt="1rem" type="submit">
          Submit
        </Button>
        {submitValues && <Text mt="1rem">Submitted: {submitValues}</Text>}
      </form>
    </FormProvider>
  )
}

/** The default a new field carries: 24-hour, no seconds. */
export const TwentyFourHour = Template.bind({})
TwentyFourHour.args = { schema: baseSchema }

/** 12-hour, with the AM/PM toggle beside the input. */
export const TwelveHour = Template.bind({})
TwelveHour.args = {
  schema: { ...baseSchema, use24HourFormat: false },
}

export const WithSeconds = Template.bind({})
WithSeconds.args = {
  schema: { ...baseSchema, includeSeconds: true },
}

export const TwelveHourWithSeconds = Template.bind({})
TwelveHourWithSeconds.args = {
  schema: { ...baseSchema, use24HourFormat: false, includeSeconds: true },
}

/** An answer restored from a draft shows in the field's own format. */
export const PrefilledFromCanonical = Template.bind({})
PrefilledFromCanonical.args = {
  schema: { ...baseSchema, use24HourFormat: false },
  defaultValue: '14:30:00',
}

/** Optional, to check an unfinished entry is rejected rather than dropped. */
export const Optional = Template.bind({})
Optional.args = {
  schema: { ...baseSchema, required: false },
}
