import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import {
  NricField as NricFieldComponent,
  NricFieldProps,
  NricFieldSchema,
} from './NricField'

export default {
  title: 'Templates/Field/NricField',
  component: NricFieldComponent,
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

const baseSchema: NricFieldSchema = {
  title: 'NRIC/FIN',
  description: 'Lorem ipsum what is your NRIC',
  required: true,
  disabled: false,
  fieldType: BasicField.Nric,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryNricFieldProps extends NricFieldProps {
  defaultValue?: string
}

const Template: Story<StoryNricFieldProps> = ({ defaultValue, ...args }) => {
  const formMethods = useForm({
    defaultValues: {
      [args.schema._id]: defaultValue,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string>) => {
    setSubmitValues(values[args.schema._id] || 'Nothing was selected')
  }

  useEffect(() => {
    formMethods.trigger()
  }, [])

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <NricFieldComponent {...args} />
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
}

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...baseSchema, required: false },
}

export const ValidationInvalidNric = Template.bind({})
ValidationInvalidNric.args = {
  schema: baseSchema,
  defaultValue: 'S0000002Z',
}

export const ValidationValidNric = Template.bind({})
ValidationValidNric.args = {
  schema: baseSchema,
  defaultValue: 'S0000001I',
}
