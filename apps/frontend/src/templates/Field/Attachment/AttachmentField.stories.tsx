import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Text } from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { featureFlags } from 'formsg-shared/constants'
import { AttachmentSize, BasicField } from 'formsg-shared/types/field'

import Button from '~components/Button'

import { AttachmentFieldSchema } from '../types'

import {
  AttachmentField as AttachmentFieldComponent,
  AttachmentFieldProps,
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
  defaultValue?: File | File[]
}

const Template: StoryFn<StoryAttachmentFieldProps> = ({
  defaultValue,
  ...args
}) => {
  const formMethods = useForm({
    defaultValues: {
      [args.schema._id]: defaultValue,
    },
  })

  const [submitValues, setSubmitValues] = useState<string>()

  const onSubmit = (values: Record<string, File | File[] | undefined>) => {
    const value = values[args.schema._id]
    if (Array.isArray(value)) {
      return setSubmitValues(value.map((file) => file.name).join(', '))
    }
    const stringifyFile = (obj?: File) => {
      const replacer = []
      for (const key in obj) {
        replacer.push(key)
      }
      return JSON.stringify(obj, replacer)
    }
    setSubmitValues(stringifyFile(value) || 'Nothing was selected')
  }

  useEffect(() => {
    formMethods.trigger()
  }, [formMethods])

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

export const ValidationOptional = Template.bind({})
ValidationOptional.args = {
  schema: { ...baseSchema, required: false },
}

export const DownloadEnabled = Template.bind({})
DownloadEnabled.args = {
  schema: { ...baseSchema, required: false },
  showDownload: true,
  defaultValue: new File(['examplebtyes'], 'example.txt'),
}

export const DownloadEnabledWithDisabledUpload = Template.bind({})
DownloadEnabledWithDisabledUpload.args = {
  schema: { ...baseSchema, disabled: true },
  showDownload: true,
  defaultValue: new File(['examplebtyes'], 'example.txt'),
}

export const DisabledHighContrast = Template.bind({})
DisabledHighContrast.args = {
  schema: { ...baseSchema, disabled: true },
  isHighContrast: true,
  defaultValue: new File(['examplebtyes'], 'example.txt'),
}

// PROTOTYPE (attachments-v2): the V2 stories force the flag on.
const attachmentsV2On = new GrowthBook({
  features: { [featureFlags.attachmentsV2]: { defaultValue: true } },
})
const V2Template: StoryFn<StoryAttachmentFieldProps> = (args) => (
  <GrowthBookProvider growthbook={attachmentsV2On}>
    <Template {...args} />
  </GrowthBookProvider>
)

export const V2RestrictedToPdf = V2Template.bind({})
V2RestrictedToPdf.args = {
  schema: { ...baseSchema, allowedFileTypes: ['.pdf'] },
}

export const V2MultipleFiles = V2Template.bind({})
V2MultipleFiles.args = {
  schema: {
    ...baseSchema,
    allowMultipleAttachments: true,
    attachmentSize: AttachmentSize.SevenMb,
  },
}

export const V2MultipleFilesAttached = V2Template.bind({})
V2MultipleFilesAttached.args = {
  ...V2MultipleFiles.args,
  defaultValue: [
    new File(['a'.repeat(1_200_000)], 'passport.pdf'),
    new File(['b'.repeat(2_400_000)], 'photo.jpg'),
    new File(['c'.repeat(600_000)], 'payslip.pdf'),
  ],
}

// A field switched to multiple attachments can still start with one file,
// e.g. a restored draft. It shows as a one-item list.
export const V2MultipleFilesStartingWithOneFile = V2Template.bind({})
V2MultipleFilesStartingWithOneFile.args = {
  ...V2MultipleFiles.args,
  defaultValue: new File(['a'.repeat(800_000)], 'draft-photo.jpg'),
}
