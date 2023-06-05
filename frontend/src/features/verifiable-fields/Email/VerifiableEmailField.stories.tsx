import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { DecoratorFn, Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types/field'

import {
  postGenerateVfnOtpResponse,
  postVerifyVfnOtpResponse,
  postVfnTransactionResponse,
} from '~/mocks/msw/handlers/public-form'

import { getMobileViewParameters } from '~utils/storybook'
import Button from '~components/Button'
import {
  VerifiableFieldInput,
  VerifiableFieldValues,
} from '~templates/Field/types'

import {
  PublicFormContext,
  PublicFormContextProps,
} from '~features/public-form/PublicFormContext'

import {
  VerifiableEmailField as VerifiableEmailFieldComponent,
  VerifiableEmailFieldProps,
  VerifiableEmailFieldSchema,
} from './VerifiableEmailField'

const MockProviders: DecoratorFn = (storyFn) => {
  return (
    <PublicFormContext.Provider
      value={
        {
          formId: 'mock-form-id',
          getTransactionId: () => Promise.resolve('mock-transaction-id'),
        } as PublicFormContextProps
      }
    >
      {storyFn()}
    </PublicFormContext.Provider>
  )
}

const baseSchema: VerifiableEmailFieldSchema = {
  title: 'Your email address',
  description: 'No spam emails. Promise.',
  required: true,
  disabled: false,
  fieldType: BasicField.Email,
  isVerifiable: true,
  _id: '611b94dfbb9e300012f702a7',
  allowedEmailDomains: [],
  hasAllowedEmailDomains: false,
  autoReplyOptions: {
    hasAutoReply: false,
    autoReplySubject: '',
    autoReplySender: '',
    autoReplyMessage: '',
    includeFormSummary: false,
  },
}

interface StoryEmailFieldProps extends VerifiableEmailFieldProps {
  defaultValue?: Partial<VerifiableFieldValues>
}

export default {
  title: 'Features/VerifiableField/Email',
  component: VerifiableEmailFieldComponent,
  decorators: [MockProviders],
  parameters: {
    msw: [
      postVfnTransactionResponse({ delay: 0 }),
      postGenerateVfnOtpResponse({ delay: 0 }),
      postVerifyVfnOtpResponse({ delay: 0 }),
    ],
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
} as Meta<StoryEmailFieldProps>

const Template: Story<StoryEmailFieldProps> = ({ defaultValue, ...args }) => {
  const formMethods = useForm<VerifiableFieldInput>({
    defaultValues: {
      [args.schema._id]: defaultValue,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: VerifiableFieldInput) => {
    setSubmitValues(
      JSON.stringify(values[args.schema._id]) || 'Nothing was selected',
    )
  }

  useEffect(() => {
    // Snapshot verified state, but only verification box can set signature.
    if (defaultValue !== undefined && !defaultValue.signature) {
      formMethods.trigger()
    }
    // Only want it to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <VerifiableEmailFieldComponent {...args} />
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

export const VerifiableEmailField = Template.bind({})

export const PendingVerification = Template.bind({})
PendingVerification.args = {
  defaultValue: {
    value: 'test@example.com',
  },
}

export const PendingVerificationMobile = Template.bind({})
PendingVerificationMobile.args = PendingVerification.args
PendingVerificationMobile.parameters = getMobileViewParameters()

export const Verified = Template.bind({})
Verified.args = {
  defaultValue: {
    value: 'test@example.com',
    signature: 'some-signature',
  },
}
