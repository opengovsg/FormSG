import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import {
  MobileFieldSchema,
  VerifiableFieldInput,
  VerifiableFieldValues,
} from '../types'

import {
  MobileField as MobileFieldComponent,
  MobileFieldProps,
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

const baseSchema: MobileFieldSchema = {
  title: 'Your mobile number',
  description: 'No spam calls. Promise.',
  required: true,
  disabled: false,
  fieldType: BasicField.Mobile,
  isVerifiable: false,
  allowIntlNumbers: false,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryMobileFieldProps extends MobileFieldProps {
  defaultValue?: Partial<VerifiableFieldValues>
}

const Template: StoryFn<StoryMobileFieldProps> = ({
  defaultValue,
  ...args
}) => {
  const formMethods = useForm<VerifiableFieldInput>({
    defaultValues: {
      [args.schema._id]: defaultValue,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: VerifiableFieldInput) => {
    setSubmitValues(values[args.schema._id]?.value || 'Nothing was selected')
  }

  useEffect(() => {
    if (defaultValue !== undefined) {
      formMethods.trigger()
    }
    // Only want it to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  schema: baseSchema,
  defaultValue: {
    value: '',
  },
}

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...baseSchema, required: false },
}

export const ValidationAllowIntl = Template.bind({})
ValidationAllowIntl.args = {
  schema: { ...baseSchema, allowIntlNumbers: true },
  defaultValue: {
    value: '+447777777777',
  },
}

export const ValidationInvalidMobile = Template.bind({})
ValidationInvalidMobile.args = {
  schema: baseSchema,
  defaultValue: {
    value: '64321098',
  },
}

export const ValidationValidMobile = Template.bind({})
ValidationValidMobile.args = {
  schema: baseSchema,
  defaultValue: {
    value: '98765432',
  },
}
