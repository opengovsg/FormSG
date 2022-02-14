import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'
import { userEvent, within } from '@storybook/testing-library'

import { AttachmentSize, BasicField } from '~shared/types/field'

import Button from '~components/Button'

import {
  AttachmentField as AttachmentFieldComponent,
  AttachmentFieldProps,
  AttachmentFieldSchema,
} from './AttachmentField'

export default {
  title: 'Templates/Field/AttachmentField',
  component: AttachmentFieldComponent,
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

const submitPlayFn = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement
}) => {
  const canvas = within(canvasElement)
  await userEvent.click(
    canvas.getByRole('button', {
      name: /submit/i,
    }),
  )
}

const baseSchema: AttachmentFieldSchema = {
  title: 'Attach something',
  description: 'Lorem ipsum what do you want to attach',
  required: true,
  disabled: false,
  fieldType: BasicField.Attachment,
  attachmentSize: AttachmentSize.TenMb,
  _id: '611b94dfbb9e300012f702a7',
}

interface StoryAttachmentFieldProps extends AttachmentFieldProps {
  defaultValue?: File
}

const Template: Story<StoryAttachmentFieldProps> = ({
  defaultValue,
  ...args
}) => {
  const formMethods = useForm({
    defaultValues: {
      [args.schema._id]: defaultValue,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, File>) => {
    const stringifyFile = (obj: File) => {
      const replacer = []
      for (const key in obj) {
        replacer.push(key)
      }
      return JSON.stringify(obj, replacer)
    }
    setSubmitValues(
      stringifyFile(values[args.schema._id]) || 'Nothing was selected',
    )
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={formMethods.handleSubmit(onSubmit)} noValidate>
        <AttachmentFieldComponent {...args} />
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
ValidationRequired.play = submitPlayFn

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...baseSchema, required: false },
}
ValidationOptional.play = submitPlayFn
