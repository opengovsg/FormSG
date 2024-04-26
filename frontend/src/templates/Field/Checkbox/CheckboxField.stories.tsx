import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'
import { merge } from 'lodash'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import { CheckboxFieldSchema } from '../types'

import {
  CheckboxField as CheckboxFieldComponent,
  CheckboxFieldProps,
} from './CheckboxField'

export default {
  title: 'Templates/Field/CheckboxField',
  component: CheckboxFieldComponent,
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

const baseSchema: CheckboxFieldSchema = {
  othersRadioButton: true,
  validateByValue: false,
  ValidationOptions: {
    customMax: null,
    customMin: null,
  },
  fieldOptions: ['apple', 'pear', 'orange', 'durian'],
  title: 'Favourite fruit',
  description: 'It has to be durian, right?',
  required: true,
  disabled: false,
  fieldType: BasicField.Checkbox,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryCheckboxFieldProps extends CheckboxFieldProps {
  triggerValidation?: boolean
  defaultValue?: string
}

const Template: StoryFn<StoryCheckboxFieldProps> = ({
  defaultValue,
  triggerValidation,
  ...args
}) => {
  const formMethods = useForm({
    defaultValues: {
      [args.schema._id]: defaultValue,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string | undefined>) => {
    setSubmitValues(
      JSON.stringify(values[args.schema._id]) || 'Nothing was selected',
    )
  }

  useEffect(() => {
    if (triggerValidation) {
      formMethods.trigger()
    }
  }, [formMethods, triggerValidation])

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <CheckboxFieldComponent {...args} />
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
  triggerValidation: true,
}

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...baseSchema, required: false },
}

export const WithoutOthersOption = Template.bind({})
WithoutOthersOption.args = {
  schema: merge({}, baseSchema, { othersRadioButton: false }),
}
