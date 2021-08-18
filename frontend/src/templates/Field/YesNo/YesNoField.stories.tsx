import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import { YesNoField, YesNoFieldProps, YesNoFieldSchema } from './YesNoField'

export default {
  title: 'Templates/Field/YesNo Field',
  component: YesNoField,
  decorators: [],
} as Meta

const schema: YesNoFieldSchema = {
  title: 'Do you like apples',
  description:
    'Not oranges, not any other fruits. I only want to know your apple preferences.',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '611b94dfbb9e300012f702a7',
}

export const Default: Story<YesNoFieldProps> = (args) => {
  const formMethods = useForm()

  const [submitValues, setSubmitValues] = useState('')

  const onSubmit = (values: Record<string, string>) => {
    return setSubmitValues(values[args.schema._id])
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <YesNoField {...args} />
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
Default.args = {
  schema,
}
Default.storyName = 'YesNo Field'
