import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { BasicField, SignatureVectorArray } from '~shared/types'

import Button from '~components/Button'

import { SignatureFieldInput, SignatureFieldSchema } from '../types'

import {
  SignatureField as SignatureFieldComponent,
  SignatureFieldProps,
} from './SignatureField'

const baseSchema: SignatureFieldSchema = {
  title: 'Signature',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Signature,
  _id: 'random-signature-id',
}

const fakeSignature: SignatureVectorArray = [
  [
    [10, 20, 0.5],
    [12, 22, 0.6],
    [15, 24, 0.6],
    [18, 25, 0.7],
    [22, 26, 0.8],
    [27, 28, 0.7],
    [30, 30, 0.6],
    [32, 32, 0.4],
  ],
  [
    [40, 40, 0.5],
    [42, 42, 0.6],
    [44, 43, 0.7],
    [46, 45, 0.8],
    [49, 46, 0.7],
    [51, 48, 0.5],
  ],
]

export default {
  title: 'Templates/Field/SignatureField',
  component: SignatureFieldComponent,
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

interface StorySignatureFieldProps extends SignatureFieldProps {
  defaultValue?: SignatureFieldInput
}

const Template: StoryFn<StorySignatureFieldProps> = ({
  defaultValue,
  ...args
}) => {
  const methods = useForm({
    defaultValues: {
      [args.schema._id]:
        defaultValue ??
        ({ type: 'draw', value: [] } as unknown as SignatureFieldInput),
    },
  })

  const [submitValues, setSubmitValues] = useState<
    SignatureFieldInput | undefined
  >()

  const onSubmit = (values: Record<string, SignatureFieldInput>) => {
    const sigValue = values[args.schema._id]
    setSubmitValues(sigValue)
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <SignatureFieldComponent {...args} />
        <Button
          mt="1rem"
          type="submit"
          isLoading={methods.formState.isSubmitting}
          loadingText="Submitting"
        >
          Submit
        </Button>
        {submitValues && (
          <Text>You have submitted: {JSON.stringify(submitValues)}</Text>
        )}
      </form>
    </FormProvider>
  )
}

export const ValidationRequired = Template.bind({})
ValidationRequired.args = {
  schema: baseSchema,
}

export const ValidationNotRequired = Template.bind({})
ValidationNotRequired.args = {
  schema: { ...baseSchema, required: false },
}

export const WithSignature = Template.bind({})
WithSignature.args = {
  schema: baseSchema,
  defaultValue: {
    type: 'draw',
    value: fakeSignature,
  } as unknown as SignatureFieldInput,
}

export const DisabledWithSignature = Template.bind({})
DisabledWithSignature.args = {
  schema: { ...baseSchema, disabled: true },
  defaultValue: {
    type: 'draw',
    value: fakeSignature,
  } as unknown as SignatureFieldInput,
}
