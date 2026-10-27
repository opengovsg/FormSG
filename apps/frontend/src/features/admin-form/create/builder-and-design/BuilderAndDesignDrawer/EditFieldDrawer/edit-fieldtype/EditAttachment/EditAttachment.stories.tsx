import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { featureFlags } from 'formsg-shared/constants'
import {
  AttachmentFieldBase,
  AttachmentSize,
  BasicField,
  FormResponseMode,
  FormStatus,
} from 'formsg-shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditAttachment } from './EditAttachment'

const DEFAULT_ATTACHMENT_FIELD: AttachmentFieldBase = {
  title: 'Attachment field',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Attachment,
  globalId: 'unused',
  attachmentSize: AttachmentSize.FourMb,
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditAttachment',
  component: EditAttachment,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
    EditFieldDrawerDecorator,
  ],
  parameters: {
    msw: [...createFormBuilderMocks({}, 0)],
  },
  args: {
    field: DEFAULT_ATTACHMENT_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: AttachmentFieldBase
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditAttachment field={field} />
}

export const Default = Template.bind({})

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [...createFormBuilderMocks({}, 'infinite')],
}

export const AttachmentExceedQuota = Template.bind({})
AttachmentExceedQuota.parameters = {
  msw: [
    ...createFormBuilderMocks(
      {
        form_fields: [
          {
            title: 'Attach something',
            description: 'Lorem ipsum what do you want to attach',
            required: true,
            disabled: false,
            fieldType: BasicField.Attachment,
            attachmentSize: AttachmentSize.FourMb,
            _id: '611b94dfbb9e300012f702a7',
          },
        ],
      },
      0,
    ),
  ],
}

// PROTOTYPE (attachments-v2): the V2 stories force the flag on.
const attachmentsV2On = new GrowthBook({
  features: { [featureFlags.attachmentsV2]: { defaultValue: true } },
})
const V2Template: StoryFn<StoryArgs> = ({ field }) => (
  <GrowthBookProvider growthbook={attachmentsV2On}>
    <EditAttachment field={field} />
  </GrowthBookProvider>
)

// Storage-mode form, so the multiple attachments toggle shows.
const v2FormMocks = (status = FormStatus.Private) =>
  createFormBuilderMocks({ responseMode: FormResponseMode.Encrypt, status }, 0)

export const V2Default = V2Template.bind({})
V2Default.parameters = { msw: v2FormMocks() }

export const V2RestrictedToPdf = V2Template.bind({})
V2RestrictedToPdf.args = {
  field: { ...DEFAULT_ATTACHMENT_FIELD, allowedFileTypes: ['.msg', '.pdf'] },
}
V2RestrictedToPdf.parameters = { msw: v2FormMocks() }

export const V2MultipleAttachments = V2Template.bind({})
V2MultipleAttachments.args = {
  field: { ...DEFAULT_ATTACHMENT_FIELD, allowMultipleAttachments: true },
}
V2MultipleAttachments.parameters = { msw: v2FormMocks() }

export const AttachmentWithinQuota = Template.bind({})
AttachmentWithinQuota.parameters = {
  msw: [
    ...createFormBuilderMocks(
      {
        form_fields: [
          {
            title: 'Attach something',
            description: 'Lorem ipsum what do you want to attach',
            required: true,
            disabled: false,
            fieldType: BasicField.Attachment,
            attachmentSize: AttachmentSize.OneMb,
            _id: '611b94dfbb9e300012f702a7',
          },
        ],
      },
      0,
    ),
  ],
}
