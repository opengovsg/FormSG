import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { BasicField } from 'formsg-shared/types/field'

import Button from '~components/Button'

import { AddressCompoundFieldInput, AddressCompoundFieldSchema } from '../types'

import {
  AddressCompoundField as AddressFieldComponent,
  AddressCompoundFieldProps,
} from './AddressField'

const baseSchema: AddressCompoundFieldSchema = {
  title: 'Local address',
  description: '',
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

interface StoryAddressFieldProps extends AddressCompoundFieldProps {
  defaultValue?: AddressCompoundFieldInput
  apiError?: string | null
}

const Template: StoryFn<StoryAddressFieldProps> = ({
  defaultValue,
  ...args
}) => {
  const formMethods = useForm<AddressCompoundFieldInput>({
    defaultValues: defaultValue,
  })

  const [submitValues, setSubmitValues] = useState<string>()

  // const onSubmit = (data: unknown) => alert(JSON.stringify(data))
  const onSubmit = (values: AddressCompoundFieldInput) => {
    const fieldValue = values[args.schema._id]?.addressSubFields || {}
    const hasValues = Object.values(fieldValue).some((val) => val?.trim())
    setSubmitValues(
      hasValues ? JSON.stringify(fieldValue) : 'Nothing was selected',
    )
  }
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
    [baseSchema._id]: {
      addressSubFields: {
        postalCode: '123456',
        blockNumber: '1',
        streetName: 'Bukit Batok Street',
        buildingName: '50',
        levelNumber: '04',
        unitNumber: '5A',
      },
    },
  },
}

export const ValidationRequired = Template.bind({})
ValidationRequired.args = {
  schema: baseSchema,
  defaultValue: {
    [baseSchema._id]: {
      addressSubFields: {
        postalCode: '',
        blockNumber: '',
        streetName: '',
        buildingName: '',
        levelNumber: '',
        unitNumber: '',
      },
    },
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
    [baseSchema._id]: {
      addressSubFields: {
        postalCode: '123az#$%',
        blockNumber: '',
        streetName: '',
        buildingName: '',
        levelNumber: '',
        unitNumber: '',
      },
    },
  },
}

export const InvalidBlockAndUnit = Template.bind({})
InvalidBlockAndUnit.args = {
  schema: baseSchema,
  defaultValue: {
    [baseSchema._id]: {
      addressSubFields: {
        postalCode: '123456',
        blockNumber: '%1',
        streetName: 'Bukit Batok Street',
        buildingName: '50',
        levelNumber: '04',
        unitNumber: '5A@',
      },
    },
  },
}

export const InvalidLevelUnit = Template.bind({})
InvalidLevelUnit.args = {
  schema: baseSchema,
  defaultValue: {
    [baseSchema._id]: {
      addressSubFields: {
        postalCode: '123456',
        blockNumber: '1',
        streetName: 'Bukit Batok Street',
        buildingName: '50',
        levelNumber: '04',
        unitNumber: '5A#',
      },
    },
  },
}

export const ValidPostalCodeApiFail = Template.bind({})
ValidPostalCodeApiFail.args = {
  schema: baseSchema,
  defaultValue: {
    [baseSchema._id]: {
      addressSubFields: {
        postalCode: '000000',
        blockNumber: '',
        streetName: '',
        buildingName: '',
        levelNumber: '',
        unitNumber: '',
      },
    },
  },
}

// OneMap is a live third-party API, so answer it locally with no results.
ValidPostalCodeApiFail.parameters = {
  msw: {
    handlers: {
      oneMap: http.get(
        'https://www.onemap.gov.sg/api/common/elastic/search',
        () =>
          HttpResponse.json({
            found: 0,
            totalNumPages: 0,
            pageNum: 1,
            results: [],
          }),
      ),
    },
  },
}
ValidPostalCodeApiFail.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const findAddress = canvas.getByRole('button', { name: /Find Address/i })

  await userEvent.click(findAddress)
  const [error] = await canvas.findAllByText(
    'Address cannot be found. Please fill in details manually',
  )
  await expect(error).toBeVisible()
  // The button stays disabled for 2s after a lookup to throttle requests.
  await waitFor(() => expect(findAddress).toBeEnabled(), { timeout: 3000 })
}

export const DisabledHighContrast = Template.bind({})
DisabledHighContrast.args = {
  schema: { ...baseSchema, disabled: true },
  isHighContrast: true,
  defaultValue: WithValues.args.defaultValue,
}
