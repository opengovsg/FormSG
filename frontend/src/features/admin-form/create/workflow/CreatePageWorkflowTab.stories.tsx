import { Meta, StoryFn } from '@storybook/react'

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

const form_field_5: FormFieldDto = {
  title: 'My email (for updates)',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Email,
  _id: '617a262d4fa0850013d1568f',
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
}

const form_field_6: FormFieldDto = {
  title: "Approver's email",
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Email,
  _id: '61e6857c9c794b0012f1c6f7',
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
}

const form_field_7: FormFieldDto = {
  title: 'Approve time off?',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '61e6857c9c794b0012f1c6u9',
}

const dropdown_field_valid_mapping: FormFieldDto = {
  title: 'Department',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Dropdown,
  fieldOptions: ['Engineering', 'Design', 'Operations', 'Product'],
  optionsToRecipientsMap: {
    Engineering: ['kevin@example.com'],
    Design: ['alicia@example.com'],
    Operations: ['ruchel@example.com'],
    Product: ['kenneth@example.com'],
  },
  _id: '6200e1534ad4f00012848d91',
}

const dropdown_field_missing_options_mapping: FormFieldDto = {
  title: 'Department',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Dropdown,
  fieldOptions: ['Engineering', 'Design', 'Operations', 'Product'],
  optionsToRecipientsMap: {
    Engineering: ['kevin@example.com'],
    Design: ['alicia@example.com'],
    Operations: ['ruchel@example.com'],
  },
  _id: '6200e1534ad4f00012848d92',
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

const workflow_step_2_with_deleted_field: FormWorkflowStepDto = {
  _id: '61e6857c9c794b0012f1cnkl',
  workflow_type: WorkflowType.Static,
  emails: ['test_1@tech.gov.sg', 'test_2@tech.gov.sg'],
  edit: ['deleted_object_id_1', form_field_4._id],
}

const workflow_step_2_with_all_fields_deleted: FormWorkflowStepDto = {
  _id: '61e6857c9c794b0012f1cnkl',
  workflow_type: WorkflowType.Static,
  emails: ['test_1@tech.gov.sg', 'test_2@tech.gov.sg'],
  edit: ['deleted_object_id_1', 'deleted_object_id_2'],
}

const workflow_step_2_with_valid_conditional_recipient: FormWorkflowStepDto = {
  _id: '61e6857c9c794b001ak3cnkl',
  workflow_type: WorkflowType.Conditional,
  conditional_field: dropdown_field_valid_mapping._id,
  edit: [form_field_3._id, form_field_4._id],
}

const workflow_step_2_with_invalid_conditional_recipient: FormWorkflowStepDto =
  {
    _id: '61e6857c9c794b001ak3cnkl',
    workflow_type: WorkflowType.Conditional,
    conditional_field: dropdown_field_missing_options_mapping._id,
    edit: [form_field_3._id, form_field_4._id],
  }

const workflow_step_3_with_approval: FormWorkflowStepDto = {
  _id: '61e6857c9c794b0012f1c6g2',
  workflow_type: WorkflowType.Dynamic,
  field: form_field_6._id,
  edit: [form_field_7._id],
  approval_field: form_field_7._id,
}

const workflow_step_3_with_deleted_approval: FormWorkflowStepDto = {
  _id: '61e6857c9c7ikb0012f1c6g3',
  workflow_type: WorkflowType.Dynamic,
  field: form_field_6._id,
  edit: [form_field_7._id],
  approval_field: 'deleted_object_id',
}

const FORM_WITH_WORKFLOW: Partial<AdminFormDto> = {
  responseMode: FormResponseMode.Multirespondent,
  form_fields: [
    form_field_1,
    form_field_2,
    form_field_3,
    form_field_4,
    form_field_5,
    form_field_6,
    form_field_7,
    dropdown_field_valid_mapping,
    dropdown_field_missing_options_mapping,
  ],
  workflow: [workflow_step_1, workflow_step_2],
}

const Template: StoryFn = () => <CreatePageWorkflowTab />
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

export const Step1 = Template.bind({})
Step1.parameters = {
  msw: buildMswRoutes({
    ...FORM_WITH_WORKFLOW,
    workflow: [workflow_step_1],
  }),
  documentation: {
    storyDescription:
      'Step 1 of a workflow should not show any respondent selected',
  },
}

export const Step3Approval = Template.bind({})
Step3Approval.parameters = {
  msw: buildMswRoutes({
    ...FORM_WITH_WORKFLOW,
    workflow: [workflow_step_1, workflow_step_2, workflow_step_3_with_approval],
  }),
}

export const Step3ApprovalFieldDeleted = Template.bind({})
Step3ApprovalFieldDeleted.parameters = {
  msw: buildMswRoutes({
    ...FORM_WITH_WORKFLOW,
    workflow: [
      workflow_step_1,
      workflow_step_2,
      workflow_step_3_with_deleted_approval,
    ],
  }),
}

export const Step2FieldDeleted = Template.bind({})
Step2FieldDeleted.parameters = {
  msw: buildMswRoutes({
    ...FORM_WITH_WORKFLOW,
    workflow: [workflow_step_1, workflow_step_2_with_deleted_field],
  }),
}

export const Step2AllFieldsDeleted = Template.bind({})
Step2AllFieldsDeleted.parameters = {
  msw: buildMswRoutes({
    ...FORM_WITH_WORKFLOW,
    workflow: [workflow_step_1, workflow_step_2_with_all_fields_deleted],
  }),
}

export const Step2ValidConditionalRecipientSelected = Template.bind({})
Step2ValidConditionalRecipientSelected.parameters = {
  msw: buildMswRoutes({
    ...FORM_WITH_WORKFLOW,
    workflow: [
      workflow_step_1,
      workflow_step_2_with_valid_conditional_recipient,
    ],
  }),
}

export const Step2InvalidConditionalRecipientSelected = Template.bind({})
Step2InvalidConditionalRecipientSelected.parameters = {
  msw: buildMswRoutes({
    ...FORM_WITH_WORKFLOW,
    workflow: [
      workflow_step_1,
      workflow_step_2_with_invalid_conditional_recipient,
    ],
  }),
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: buildMswRoutes({}, 'infinite'),
}
