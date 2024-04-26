import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import type { Meta, StoryFn } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import { UenFieldSchema } from '../types'

import { UenField as UenFieldComponent, UenFieldProps } from './UenField'

export default {
  title: 'Templates/Field/UenField',
  component: UenFieldComponent,
  decorators: [],
  parameters: {
    docs: {
      // Required in this story due to react-hook-form conflicting with
      // Storybook somehow.
      // See https://github.com/storybookjs/storybook/issues/12747.
      source: {
        type: 'code',
      },
    },
  },
} as Meta

const baseSchema: UenFieldSchema = {
  title: 'UEN',
  description: 'Lorem ipsum what is your uen',
  required: true,
  disabled: false,
  fieldType: BasicField.Uen,
  _id: '611b94dfbb9e300012f702a7',
  questionNumber: 1,
}

interface StoryUenFieldProps extends UenFieldProps {
  defaultValue?: string
}

const Template: StoryFn<StoryUenFieldProps> = ({ defaultValue, ...args }) => {
  const formMethods = useForm({
    defaultValues: {
      [args.schema._id]: defaultValue,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string | undefined>) => {
    setSubmitValues(values[args.schema._id] || 'Nothing was selected')
  }

  useEffect(() => {
    if (defaultValue !== undefined) {
      formMethods.trigger()
    }
  }, [defaultValue, formMethods])

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <UenFieldComponent {...args} />
        <Button
          mt="1rem"
          type="submit"
          isLoading={formMethods.formState.isSubmitting}
          loadingText="Submitting"
        >
          Submit
        </Button>
        {submitValues && <Text>You have submitted: {submitValues}</Text>}
      </form>
    </FormProvider>
  )
}

export const ValidationRequired = Template.bind({})
ValidationRequired.args = {
  schema: baseSchema,
  defaultValue: '',
}

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...baseSchema, required: false },
}

export const ValidationInvalidUen = Template.bind({})
ValidationInvalidUen.args = {
  schema: baseSchema,
  defaultValue: '0123456789',
}

export const ValidationValidUen = Template.bind({})
ValidationValidUen.args = {
  schema: baseSchema,
  defaultValue: '53333286M',
}
