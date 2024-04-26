import { Meta, StoryFn } from '@storybook/react'

import { AttachmentFieldBase, AttachmentSize, BasicField } from '~shared/types'

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
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
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
