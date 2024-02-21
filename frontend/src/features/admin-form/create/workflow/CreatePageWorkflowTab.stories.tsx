import { Meta, Story } from '@storybook/react'

import { AttachmentSize, BasicField, FormFieldDto } from '~shared/types/field'
import {
  AdminFormDto,
  FormResponseMode,
  FormWorkflowStepDto,
  WorkflowType,
} from '~shared/types/form'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter, viewports } from '~utils/storybook'

import { CreatePageWorkflowTab } from './CreatePageWorkflowTab'

const buildMswRoutes = (
  overrides?: Partial<AdminFormDto>,
  delay: number | 'infinite' = 0,
) => createFormBuilderMocks(overrides, delay)

export default {
  title: 'Pages/AdminFormPage/Create/WorkflowTab',
  component: CreatePageWorkflowTab,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    layout: 'fullscreen',
    // Required so skeleton "animation" does not hide content.
    // Pass a very short delay to avoid bug where Chromatic takes a snapshot before
    // the story has loaded
    chromatic: { pauseAnimationAtEnd: true, delay: 50 },
    msw: buildMswRoutes({
      responseMode: FormResponseMode.Multirespondent,
      workflow: [],
    }),
  },
} as Meta

const form_field_1: FormFieldDto = {
  title: 'Do you want to upload an attachment?',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '620115cf3bc125001349f9c3',
}

const form_field_2: FormFieldDto = {
  title: 'Are you really sure you want to upload an attachment?',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '620115cf3bc125001349f9c6',
}

const form_field_3: FormFieldDto = {
  title: 'Upload instructions',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Image,
  _id: '6200e1534ad4f00012848d65',
  url: 'some-mock-url',
  fileMd5Hash: 'wrjH62qBTpg0uIk4GMzOCA==',
  name: 'Upload instructions.png',
  size: '0.03 MB',
}

const form_field_4: FormFieldDto = {
  title: 'Upload attachment',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Attachment,
  _id: '61e6857c9c794b0012f1c6f7',
  attachmentSize: AttachmentSize.OneMb,
}

const workflow_step_1: FormWorkflowStepDto = {
  _id: '61e6857c9c794b0012f1c6f8',
  workflow_type: WorkflowType.Static,
  emails: [],
  edit: [form_field_1._id, form_field_2._id],
}

const workflow_step_2: FormWorkflowStepDto = {
  _id: '61e6857c9c794b0012f1c6f9',
  workflow_type: WorkflowType.Static,
  emails: ['test_1@tech.gov.sg', 'test_2@tech.gov.sg'],
  edit: [form_field_3._id, form_field_4._id],
}

const FORM_WITH_WORKFLOW: Partial<AdminFormDto> = {
  responseMode: FormResponseMode.Multirespondent,
  form_fields: [form_field_1, form_field_2, form_field_3, form_field_4],
  workflow: [workflow_step_1, workflow_step_2],
}

const Template: Story = () => <CreatePageWorkflowTab />
export const NoWorkflow = Template.bind({})

export const MobileNoWorkflow = Template.bind({})
MobileNoWorkflow.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const WithWorkflow = Template.bind({})
WithWorkflow.parameters = {
  msw: buildMswRoutes(FORM_WITH_WORKFLOW),
}

export const MobileWithWorkflow = Template.bind({})
MobileWithWorkflow.parameters = {
  msw: buildMswRoutes(FORM_WITH_WORKFLOW),
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: buildMswRoutes({}, 'infinite'),
}
