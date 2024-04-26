import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import {
  BasicField,
  NumberSelectedLengthValidation,
  NumberSelectedValidation,
} from '~shared/types/field'

import Button from '~components/Button'

import { NumberFieldSchema } from '../types'

import {
  NumberField as NumberFieldComponent,
  NumberFieldProps,
} from './NumberField'

export default {
  title: 'Templates/Field/NumberField',
  component: NumberFieldComponent,
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

const baseSchema: NumberFieldSchema = {
  title: 'Favourite number',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Number,
  ValidationOptions: {
    selectedValidation: null,
    LengthValidationOptions: {
      selectedLengthValidation: null,
      customVal: null,
    },
    RangeValidationOptions: {
      customMin: null,
      customMax: null,
    },
  },
  _id: '611b94dfbb9e300012f702a7',
  questionNumber: 1,
}

interface StoryNumberFieldProps extends NumberFieldProps {
  defaultValue?: string
}

const Template: StoryFn<StoryNumberFieldProps> = ({
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
        <NumberFieldComponent {...args} />
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

export const ValidationExact3Length = Template.bind({})
ValidationExact3Length.args = {
  schema: {
    ...baseSchema,
    ValidationOptions: {
      selectedValidation: NumberSelectedValidation.Length,
      LengthValidationOptions: {
        selectedLengthValidation: NumberSelectedLengthValidation.Exact,
        customVal: 3,
      },
      RangeValidationOptions: {
        customMin: null,
        customMax: null,
      },
    },
  },
  defaultValue: '1234',
}
export const ValidationMin6Length = Template.bind({})
ValidationMin6Length.args = {
  schema: {
    ...baseSchema,
    ValidationOptions: {
      selectedValidation: NumberSelectedValidation.Length,
      LengthValidationOptions: {
        selectedLengthValidation: NumberSelectedLengthValidation.Min,
        customVal: 6,
      },
      RangeValidationOptions: {
        customMin: null,
        customMax: null,
      },
    },
  },
  defaultValue: '123',
}

export const ValidationMax1Length = Template.bind({})
ValidationMax1Length.args = {
  schema: {
    ...baseSchema,
    ValidationOptions: {
      selectedValidation: NumberSelectedValidation.Length,
      LengthValidationOptions: {
        selectedLengthValidation: NumberSelectedLengthValidation.Max,
        customVal: 1,
      },
      RangeValidationOptions: {
        customMin: null,
        customMax: null,
      },
    },
  },
  defaultValue: '67574',
}
