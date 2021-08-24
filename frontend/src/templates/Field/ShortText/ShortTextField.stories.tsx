import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { BasicField, TextSelectedValidation } from '~shared/types/field'

import Button from '~components/Button'

import {
  ShortTextField as ShortTextFieldComponent,
  ShortTextFieldProps,
  ShortTextFieldSchema,
} from './ShortTextField'

export default {
  title: 'Templates/Field/ShortTextField',
  component: ShortTextFieldComponent,
  decorators: [],
  parameters: {
    docs: {
      // Required in this story due to rhf conflicting with Storybook somehow.
      // See https://github.com/storybookjs/storybook/issues/12747.
      source: {
        type: 'code',
      },
    },
  },
} as Meta

const baseSchema: ShortTextFieldSchema = {
  ValidationOptions: {
    customVal: null,
    selectedValidation: null,
  },
  title: 'Lorem ipsum',
  description: 'Please type some cool things in the field',
  required: true,
  disabled: false,
  fieldType: BasicField.ShortText,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryShortTextFieldProps extends ShortTextFieldProps {
  defaultValue?: string
}

const Template: Story<StoryShortTextFieldProps> = ({
  defaultValue,
  ...args
}) => {
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
    if (defaultValue) {
      formMethods.trigger()
    }
  }, [])

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <ShortTextFieldComponent {...args} />
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
      customVal: 3,
      selectedValidation: TextSelectedValidation.Exact,
    },
  },
  defaultValue: 'abcdefg',
}
export const ValidationMin6Length = Template.bind({})
ValidationMin6Length.args = {
  schema: {
    ...baseSchema,
    ValidationOptions: {
      customVal: 6,
      selectedValidation: TextSelectedValidation.Minimum,
    },
  },
  defaultValue: 'hmm',
}

export const ValidationMax1Length = Template.bind({})
ValidationMax1Length.args = {
  schema: {
    ...baseSchema,
    ValidationOptions: {
      customVal: 1,
      selectedValidation: TextSelectedValidation.Maximum,
    },
  },
  defaultValue: 'too long',
}
