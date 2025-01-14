import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import { DecimalFieldSchema } from '../types'

import {
  DecimalField as DecimalFieldComponent,
  DecimalFieldProps,
} from './DecimalField'

export default {
  title: 'Templates/Field/DecimalField',
  component: DecimalFieldComponent,
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

const baseSchema: DecimalFieldSchema = {
  title: 'Favourite number',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Decimal,
  ValidationOptions: {
    customMax: null,
    customMin: null,
  },
  validateByValue: false,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryDecimalFieldProps extends DecimalFieldProps {
  defaultValue?: string
}

const Template: StoryFn<StoryDecimalFieldProps> = ({
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
        <DecimalFieldComponent {...args} />
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

export const ValidationRange = Template.bind({})
ValidationRange.args = {
  schema: {
    ...baseSchema,
    ValidationOptions: {
      customMin: 1.142,
      customMax: 3.142,
    },
    validateByValue: true,
  },
  defaultValue: '1234',
}
export const ValidationMinValue = Template.bind({})
ValidationMinValue.args = {
  schema: {
    ...baseSchema,
    ValidationOptions: {
      customMin: 6,
      customMax: null,
    },
    validateByValue: true,
  },
  defaultValue: '5',
}

export const ValidationMaxValue = Template.bind({})
ValidationMaxValue.args = {
  schema: {
    ...baseSchema,
    ValidationOptions: {
      customMin: 1,
      customMax: 1.2345,
    },
    validateByValue: true,
  },
  defaultValue: '1.3345',
}

export const ValidationInvalidDecimal = Template.bind({})
ValidationInvalidDecimal.args = {
  schema: baseSchema,
  defaultValue: '-e',
}
