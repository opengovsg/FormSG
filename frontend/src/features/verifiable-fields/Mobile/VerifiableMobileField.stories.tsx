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
  VerifiableMobileField as VerifiableMobileFieldComponent,
  VerifiableMobileFieldProps,
  VerifiableMobileFieldSchema,
} from './VerifiableMobileField'

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

const baseSchema: VerifiableMobileFieldSchema = {
  title: 'Your mobile number',
  description: 'No spam calls. Promise.',
  required: true,
  disabled: false,
  fieldType: BasicField.Mobile,
  isVerifiable: true,
  allowIntlNumbers: false,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryMobileFieldProps extends VerifiableMobileFieldProps {
  defaultValue?: Partial<VerifiableFieldValues>
}

export default {
  title: 'Features/VerifiableField/Mobile',
  component: VerifiableMobileFieldComponent,
  decorators: [MockProviders],
  parameters: {
    msw: [
      postVfnTransactionResponse(),
      postGenerateVfnOtpResponse(),
      postVerifyVfnOtpResponse(),
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
} as Meta<StoryMobileFieldProps>

const Template: Story<StoryMobileFieldProps> = ({ defaultValue, ...args }) => {
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
        <VerifiableMobileFieldComponent {...args} />
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

export const VerifiableMobileField = Template.bind({})

export const PendingVerification = Template.bind({})
PendingVerification.args = {
  defaultValue: {
    value: '+6598888888',
  },
}

export const PendingVerificationMobile = Template.bind({})
PendingVerificationMobile.args = PendingVerification.args
PendingVerificationMobile.parameters = getMobileViewParameters()

export const Verified = Template.bind({})
Verified.args = {
  defaultValue: {
    value: '+6598888888',
    signature: 'some-signature',
  },
}
