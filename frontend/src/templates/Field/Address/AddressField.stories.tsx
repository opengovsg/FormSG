import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import { AddressFieldInput, AddressFieldSchema } from '../types'

import {
  AddressField as AddressFieldComponent,
  AddressFieldProps,
} from './AddressField'

const baseSchema: AddressFieldSchema = {
  title: 'Address Field',
  description: 'Add your local address',
  required: true,
  disabled: false,
  fieldType: BasicField.Address,
  _id: 'random-address-id',
}

export default {
  title: 'Templates/Field/Address',
  component: AddressFieldComponent,
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
  args: {
    schema: baseSchema,
  },
} as Meta

interface StoryAddressFieldProps extends AddressFieldProps {
  defaultValue?: AddressFieldInput
  apiError?: string | null
}

const Template: StoryFn<StoryAddressFieldProps> = ({
  defaultValue,
  ...args
}) => {
  const formMethods = useForm<AddressFieldInput>({
    defaultValues: defaultValue,
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, string | undefined>) => {
    setSubmitValues(values[args.schema._id] || 'Nothing was selected')
  }

  useEffect(() => {
    if (defaultValue) {
      Object.entries(defaultValue).forEach(([key, value]) => {
        // Type assertion to ensure `key` is one of the valid keys of `AddressFieldValues`
        formMethods.setValue(key as keyof AddressFieldInput, value)
      })
      formMethods.trigger()
    }
  }, [defaultValue, formMethods])
  console.log('Form methods:', formMethods)
  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <AddressFieldComponent {...args} />
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

export const WithValues = Template.bind({})
WithValues.args = {
  schema: baseSchema,
  defaultValue: {
    postalCode: '123456',
    blockNumber: '1',
    streetName: 'Bukit Batok Street',
    buildingName: '50',
    levelNumber: '04',
    unitNumber: '5A',
  },
}

export const ValidationRequired = Template.bind({})
ValidationRequired.args = {
  schema: baseSchema,
  defaultValue: {
    postalCode: '',
    blockNumber: '',
    streetName: '',
    buildingName: '',
    levelNumber: '',
    unitNumber: '',
  },
}

export const ValidationNotRequired = Template.bind({})
ValidationNotRequired.args = {
  schema: { ...baseSchema, required: false },
}

export const InvalidPostalCode = Template.bind({})
InvalidPostalCode.args = {
  schema: baseSchema,
  defaultValue: {
    postalCode: '123az#$%',
    blockNumber: '',
    streetName: '',
    buildingName: '',
    levelNumber: '',
    unitNumber: '',
  },
}

export const InvalidBlockAndUnit = Template.bind({})
InvalidBlockAndUnit.args = {
  schema: baseSchema,
  defaultValue: {
    postalCode: '123456',
    blockNumber: '%1',
    streetName: 'Bukit Batok Street',
    buildingName: '50',
    levelNumber: '04',
    unitNumber: '5A@',
  },
}

export const InvalidLevelUnit = Template.bind({})
InvalidLevelUnit.args = {
  schema: baseSchema,
  defaultValue: {
    postalCode: '123456',
    blockNumber: '1',
    streetName: 'Bukit Batok Street',
    buildingName: '50',
    levelNumber: '04#',
    unitNumber: '5A',
  },
}

export const ValidPostalCodeApiFail = Template.bind({})
ValidPostalCodeApiFail.args = {
  schema: baseSchema,
  defaultValue: {
    postalCode: '444444',
    blockNumber: 'INVALID',
    streetName: 'INVALID',
    buildingName: '',
    levelNumber: '',
    unitNumber: '',
  },
}
