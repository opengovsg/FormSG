import { expect, userEvent, waitFor, within } from '@storybook/test'

import {
  BasicField,
  FormFieldDto,
  FormResponseMode,
  WorkflowType,
} from '~shared/types'

import { getAdminFormView } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { EditStepBlock } from './EditStepBlock'

const form_field_1: FormFieldDto = {
  title: 'Approve time off?',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '620115cf3bc125001349f9c3',
}

const form_field_2: FormFieldDto = {
  title: 'Approve claim?',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '620115cf3bc125001349f9c6',
}

const form_field_3: FormFieldDto = {
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

const form_field_4: FormFieldDto = {
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

const form_field_5: FormFieldDto = {
  title: 'Short answer',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.ShortText,
  _id: '6200e1534ad4f00012848d90',
  ValidationOptions: {
    customVal: null,
    selectedValidation: null,
  },
  allowPrefill: false,
}

const mrfFormViewWithFields = [
  getAdminFormView({
    mode: FormResponseMode.Multirespondent,
    overrides: {
      form_fields: [
        form_field_1,
        form_field_2,
        form_field_3,
        form_field_4,
        form_field_5,
      ],
    },
  }),
]

export default {
  component: EditStepBlock,
  title:
    'Features/AdminForm/create/workflow/components/WorkflowContent/EditStepBlock/EditStepBlock',
  args: {
    submitButtonLabel: 'Save step',
    defaultValues: {},
    isLoading: false,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onSubmit: () => {},
  },
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    msw: {
      handlers: mrfFormViewWithFields,
    },
  },
}

export const Step1Empty = {
  args: {
    stepNumber: 0,
  },
}

export const Step2Empty = {
  args: {
    stepNumber: 1,
  },
}

export const Step2FixedEmailDefault = {
  // due to the double registration of 'workflow_type' there would be a weird interaction
  // where the default value will be reset
  // thus we have to manually select the field again
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    await waitFor(
      async () =>
        expect(await canvas.getByText('Save step')).not.toBeDisabled(),
      {
        timeout: 5000,
      },
    )
    await waitFor(
      async () => {
        await userEvent.click(await canvas.getByText('Specific email(s)'))
      },
      {
        timeout: 5000,
      },
    )
  },
  args: {
    stepNumber: 1,
    defaultValues: {
      workflow_type: WorkflowType.Static,
      emails: ['me@open.gov.sg', 'invalidemail'],
    },
  },
}
export const Step2FixedEmailEmpty = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    await waitFor(
      async () =>
        expect(await canvas.getByText('Save step')).not.toBeDisabled(),
      {
        timeout: 5000,
      },
    )
    await waitFor(
      async () => {
        await userEvent.click(await canvas.getByText('Specific email(s)'))
      },
      {
        timeout: 5000,
      },
    )
  },

  args: {
    stepNumber: 1,
  },
}

export const DeletedApprovalFieldSelected = {
  args: {
    stepNumber: 1,
    defaultValues: {
      approval_field: 'deleted_objectId',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Emulates approval_field storing a deleted field ID.' +
          'The approval_field single select should be empty/cleared.' +
          'When submit is clicked, it is as if no option has been select for approval field',
      },
    },
  },
}

export const Step3AllSelectedValid = {
  args: {
    stepNumber: 2,
    defaultValues: {
      workflow_type: WorkflowType.Dynamic,
      field: form_field_4._id,
      edit: [form_field_1._id, form_field_5._id],
      approval_field: form_field_1._id,
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'When submit is clicked, no validation error should occur',
      },
    },
  },
}

export const Step4ApprovalFieldNotInEditErrorMessage = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    await waitFor(
      async () =>
        expect(await canvas.getByText('Save step')).not.toBeDisabled(),
      {
        timeout: 5000,
      },
    )
    await waitFor(
      async () => {
        await userEvent.click(await canvas.getByText('Save step'))
      },
      {
        timeout: 5000,
      },
    )
    await expect(
      await canvas.findByText((content) => {
        return content
          .toLowerCase()
          .includes(
            'the selected yes/no field has not been assigned to this respondent'.toLowerCase(),
          )
      }),
    ).toBeInTheDocument()
  },
  args: {
    stepNumber: 3,
    defaultValues: {
      workflow_type: WorkflowType.Dynamic,
      field: form_field_4._id,
      edit: [form_field_1._id, form_field_5._id],
      approval_field: form_field_2._id,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'When submit is clicked, validation error should occur since approval field is not in edit fields',
      },
    },
  },
}
