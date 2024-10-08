import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'
import { merge } from 'lodash'

import { BasicField } from '~shared/types/field'

import Button from '~components/Button'

import {
  EmailFieldSchema,
  VerifiableFieldInput,
  VerifiableFieldValues,
} from '../types'

import {
  EmailField as EmailFieldComponent,
  EmailFieldProps,
} from './EmailField'

export default {
  title: 'Templates/Field/EmailField',
  component: EmailFieldComponent,
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

const baseSchema: EmailFieldSchema = {
  title: 'Invoice email',
  description: 'Please enter it correctly. We will not resend the invoice.',
  autoReplyOptions: {
    hasAutoReply: false,
    autoReplySubject: '',
    autoReplySender: '',
    autoReplyMessage: '',
    includeFormSummary: false,
  },
  isVerifiable: false,
  hasAllowedEmailDomains: false,
  allowedEmailDomains: [],
  _id: '617a262d4fa0850013d1568f',
  required: true,
  disabled: false,
  fieldType: BasicField.Email,
}

interface StoryEmailFieldProps extends EmailFieldProps {
  defaultValue?: Partial<VerifiableFieldValues>
}

const Template: StoryFn<StoryEmailFieldProps> = ({ defaultValue, ...args }) => {
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
    formMethods.trigger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <EmailFieldComponent {...args} />
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

export const ValidationAllowedDomain = Template.bind({})
ValidationAllowedDomain.args = {
  schema: merge({}, baseSchema, {
    title: 'Only allows .gov.sg domains',
    hasAllowedEmailDomains: true,
    allowedEmailDomains: ['@gov.sg'],
    isVerifiable: true,
  }),
  defaultValue: { value: 'test@example.com' },
}

export const ValidationInvalidEmail = Template.bind({})
ValidationInvalidEmail.args = {
  schema: baseSchema,
  defaultValue: { value: 'not an email' },
}
