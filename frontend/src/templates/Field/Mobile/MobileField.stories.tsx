import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import {
  MobileField as MobileFieldComponent,
  MobileFieldProps,
  MobileFieldSchema,
} from './MobileField'

export default {
  title: 'Templates/Field/MobileField',
  component: MobileFieldComponent,
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

const requiredSchema: MobileFieldSchema = {
  title: 'Contact number',
  description:
    'Contact number is needed to contact you if we need more information',
  required: true,
  disabled: false,
  fieldType: BasicField.Mobile,
  allowIntlNumbers: true,
  isVerifiable: true,
  _id: '611b94dfbb9e300012f702a7',
}

const Template: Story<MobileFieldProps> = (args) => {
  const formMethods = useForm({ mode: 'onTouched' })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string>) => {
    const stringified = JSON.stringify(values[`${args.schema._id}`])

    setSubmitValues(
      stringified === 'undefined' ? 'Nothing was selected' : stringified,
    )
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <MobileFieldComponent {...args} />
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
