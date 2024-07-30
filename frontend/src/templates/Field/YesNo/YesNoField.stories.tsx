import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import { YesNoFieldSchema } from '../types'

import {
  YesNoField as YesNoFieldComponent,
  YesNoFieldProps,
} from './YesNoField'

export default {
  title: 'Templates/Field/YesNoField',
  component: YesNoFieldComponent,
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

const requiredSchema: YesNoFieldSchema = {
  title: 'Do you like apples',
  description:
    'Not oranges, not any other fruits. I only want to know your apple preferences.',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '611b94dfbb9e300012f702a7',
}

const Template: StoryFn<YesNoFieldProps> = (args) => {
  const formMethods = useForm()

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string>) => {
    setSubmitValues(values[args.schema._id] || 'Nothing was selected')
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <YesNoFieldComponent {...args} />
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
  schema: requiredSchema,
}

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...requiredSchema, required: false },
}
