import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import {
  CountryRegionField as CountryRegionFieldComponent,
  CountryRegionFieldProps,
  CountryRegionFieldSchema,
} from './CountryRegionField'

const baseSchema: CountryRegionFieldSchema = {
  title: 'Country/Region',
  description: 'Type or select your residential country/region',
  required: true,
  disabled: false,
  fieldType: BasicField.CountryRegion,
  fieldOptions: [],
  _id: 'random-id',
}

export default {
  title: 'Templates/Field/CountryRegionField',
  component: CountryRegionFieldComponent,
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

interface StoryCountryRegionFieldProps extends CountryRegionFieldProps {
  defaultValue?: string
}

const Template: Story<StoryCountryRegionFieldProps> = ({
  defaultValue,
  ...args
}) => {
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
    if (defaultValue) {
      formMethods.trigger()
    }
    // Only want it to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <CountryRegionFieldComponent {...args} />
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

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...baseSchema, required: false },
}

export const ValidationInvalidValue = Template.bind({})
ValidationInvalidValue.args = {
  defaultValue: 'This is not a valid option',
}
