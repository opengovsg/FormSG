import { ReactNode, useLayoutEffect, useState } from 'react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { StoryFn } from '@storybook/react'
import { expect, userEvent, waitFor, within } from '@storybook/test'

import { featureFlags } from 'formsg-shared/constants'
import {
  BasicField,
  FormFieldDto,
  FormResponseMode,
  MyInfoAttribute,
  WorkflowType,
} from 'formsg-shared/types'

import { getAdminFormView } from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { CreatePageSidebarProvider } from '~features/admin-form/create/common'

import { useAdminWorkflowStore } from '../../../adminWorkflowStore'

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

const dropdown_field_no_mapping: FormFieldDto = {
  title: 'Department',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Dropdown,
  fieldOptions: ['Engineering', 'Design', 'Operations', 'Product'],
  _id: '6200e1534ad4f00012848d90',
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
        dropdown_field_no_mapping,
        dropdown_field_valid_mapping,
        dropdown_field_missing_options_mapping,
      ],
    },
  }),
]

const myinfo_field: FormFieldDto = {
  title: 'Name',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.ShortText,
  _id: '6200e1534ad4f00012848d93',
  ValidationOptions: {
    customVal: null,
    selectedValidation: null,
  },
  allowPrefill: false,
  myInfo: { attr: MyInfoAttribute.Name },
}

const mrfFormViewWith = (form_fields: FormFieldDto[]) => [
  getAdminFormView({
    mode: FormResponseMode.Multirespondent,
    overrides: { form_fields },
  }),
]

const withCreatePageSidebar = (Story: StoryFn) => (
  <CreatePageSidebarProvider>
    <Story />
  </CreatePageSidebarProvider>
)

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
  decorators: [
    withCreatePageSidebar,
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
  ],
  parameters: {
    msw: {
      handlers: mrfFormViewWithFields,
    },
  },
}

const redesignOn = new GrowthBook({
  features: { [featureFlags.workflowBuilderRedesign]: { defaultValue: true } },
})

const withRedesignOn = (Story: StoryFn) => (
  <GrowthBookProvider growthbook={redesignOn}>
    <Story />
  </GrowthBookProvider>
)

const GuidedCreation = ({ children }: { children: ReactNode }): JSX.Element => {
  const [isCreating, setIsCreating] = useState(false)

  useLayoutEffect(() => {
    useAdminWorkflowStore.getState().setToCreating()
    setIsCreating(true)
    return () => useAdminWorkflowStore.getState().reset()
  }, [])

  return (
    <GrowthBookProvider growthbook={redesignOn}>
      {isCreating ? children : null}
    </GrowthBookProvider>
  )
}

const withGuidedCreation = (Story: StoryFn) => (
  <GuidedCreation>
    <Story />
  </GuidedCreation>
)

const revealSections =
  (count: number) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    for (let i = 0; i < count; i++) {
      await userEvent.click(
        await canvas.findByRole('button', { name: 'Continue' }),
      )
    }
  }

export const GuidedStep1Name = {
  args: { stepNumber: 0, submitButtonLabel: 'Add step' },
  decorators: [withGuidedCreation],
}

export const GuidedStep1People = {
  ...GuidedStep1Name,
  play: revealSections(1),
}

export const GuidedStep1Fields = {
  ...GuidedStep1Name,
  play: revealSections(2),
}

export const GuidedStep2WhatTheyDo = {
  args: { stepNumber: 1, submitButtonLabel: 'Add step' },
  decorators: [withGuidedCreation],
  play: revealSections(2),
}

export const GuidedStep2Fields = {
  args: { stepNumber: 1, submitButtonLabel: 'Add step' },
  decorators: [withGuidedCreation],
  play: revealSections(3),
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

export const Step2ConditionalRoutingEmpty = {
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
        await userEvent.click(
          await canvas.getByText(
            'Emails assigned to options in a Dropdown field',
          ),
        )
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

export const Step2ConditionalRouting = {
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
        await userEvent.click(
          await canvas.getByText(
            'Emails assigned to options in a Dropdown field',
          ),
        )
      },
      {
        timeout: 5000,
      },
    )
  },
  args: {
    stepNumber: 1,
    defaultValues: {
      workflow_type: WorkflowType.Conditional,
      conditional_field: dropdown_field_no_mapping._id,
    },
  },
}

export const Step2ConditionalRoutingValidOptionsUploaded = {
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
        await userEvent.click(
          await canvas.getByText(
            'Emails assigned to options in a Dropdown field',
          ),
        )
      },
      {
        timeout: 5000,
      },
    )
  },
  args: {
    stepNumber: 1,
    defaultValues: {
      workflow_type: WorkflowType.Conditional,
      conditional_field: dropdown_field_valid_mapping._id,
    },
  },
}

export const Step2ConditionalRoutingInvalidOptionsUploadedErrorMessage = {
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
        await userEvent.click(
          await canvas.getByText(
            'Emails assigned to options in a Dropdown field',
          ),
        )
      },
      {
        timeout: 5000,
      },
    )
  },
  args: {
    stepNumber: 1,
    defaultValues: {
      workflow_type: WorkflowType.Conditional,
      conditional_field: dropdown_field_missing_options_mapping._id,
    },
  },
}

export const Step2ConditionalRoutingNoFieldSelectedErrorMessage = {
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
        await userEvent.click(
          await canvas.getByText(
            'Emails assigned to options in a Dropdown field',
          ),
        )
      },
      {
        timeout: 5000,
      },
    )
    await waitFor(
      async () => {
        const saveStep = canvas.getByText('Save step')
        expect(saveStep).not.toBeDisabled()
        await userEvent.click(saveStep)
      },
      {
        timeout: 5000,
      },
    )
  },
  args: {
    stepNumber: 1,
    defaultValues: {
      workflow_type: WorkflowType.Conditional,
    },
  },
}

export const Step2ConditionalRoutingNoOptionsToReicipientsMapErrorMessage = {
  // due to the double registration of 'workflow_type' there would be a weird interaction
  // where the default value will be reset
  // thus we have to manually select the field again
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    await waitFor(
      async () => await userEvent.click(canvas.getByText('Save step')),
      {
        timeout: 5000,
      },
    )
    await waitFor(
      async () => {
        await userEvent.click(
          await canvas.getByText(
            'Emails assigned to options in a Dropdown field',
          ),
        )
      },
      {
        timeout: 5000,
      },
    )
    await waitFor(
      async () => {
        const saveStep = canvas.getByText('Save step')
        expect(saveStep).not.toBeDisabled()
        await userEvent.click(saveStep)
      },
      {
        timeout: 5000,
      },
    )
  },
  args: {
    stepNumber: 1,
    defaultValues: {
      workflow_type: WorkflowType.Conditional,
      conditional_field: dropdown_field_no_mapping._id,
    },
  },
}

export const Step2ConditionalRoutingReplace = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)

    const conditionalOption = await canvas.findByRole(
      'radio',
      { name: /Emails assigned to options in a Dropdown field/i },
      { timeout: 5000 },
    )
    await waitFor(() => expect(conditionalOption).toBeEnabled(), {
      timeout: 5000,
    })
    await userEvent.click(conditionalOption)
    await waitFor(() => expect(conditionalOption).toBeChecked(), {
      timeout: 5000,
    })

    const replaceButton = await canvas.findByLabelText(
      'Click to replace file',
      undefined,
      { timeout: 5000 },
    )
    await waitFor(() => expect(replaceButton).toBeEnabled(), { timeout: 5000 })
    await userEvent.click(replaceButton)

    // Replacing opens the replace-CSV modal, which is what this story captures.
    // The modal portals to the body, so it is outside canvasElement.
    await expect(
      await within(document.body).findByRole(
        'dialog',
        { name: /replace your csv file/i },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument()
  },
  args: {
    stepNumber: 3,
    defaultValues: {
      workflow_type: WorkflowType.Conditional,
      conditional_field: dropdown_field_valid_mapping._id,
    },
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
      workflow_type: WorkflowType.Static,
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

    const saveButton = await canvas.findByRole(
      'button',
      { name: 'Save step' },
      { timeout: 5000 },
    )
    await waitFor(() => expect(saveButton).toBeEnabled(), { timeout: 5000 })
    await userEvent.click(saveButton)

    await expect(
      await canvas.findByText(
        /the selected yes\/no field has not been assigned to this respondent/i,
        undefined,
        { timeout: 5000 },
      ),
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

const selectRespondentOption =
  (label: string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    const option = await canvas.findByRole(
      'radio',
      { name: new RegExp(label, 'i') },
      { timeout: 5000 },
    )
    await waitFor(() => expect(option).toBeEnabled(), { timeout: 5000 })
    await userEvent.click(option)
    await waitFor(() => expect(option).toBeChecked(), { timeout: 5000 })
  }

export const EmptyStateFieldsPicker = {
  args: { stepNumber: 0 },
  decorators: [withRedesignOn],
  parameters: { msw: { handlers: mrfFormViewWith([]) } },
}

export const EmptyStateFieldsPickerMyInfoOnly = {
  args: { stepNumber: 1 },
  decorators: [withRedesignOn],
  parameters: { msw: { handlers: mrfFormViewWith([myinfo_field]) } },
}

export const EmptyStateEmailRouting = {
  args: { stepNumber: 1 },
  decorators: [withRedesignOn],
  parameters: {
    msw: {
      handlers: mrfFormViewWith([
        form_field_1,
        form_field_5,
        dropdown_field_valid_mapping,
      ]),
    },
  },
  play: selectRespondentOption('An Email field from the form'),
}

export const EmptyStateConditionalRouting = {
  args: { stepNumber: 1 },
  decorators: [withRedesignOn],
  parameters: {
    msw: {
      handlers: mrfFormViewWith([form_field_1, form_field_3, form_field_5]),
    },
  },
  play: selectRespondentOption(
    'Emails assigned to options in a Dropdown field',
  ),
}

export const EmptyStateApprovalField = {
  args: {
    stepNumber: 1,
    defaultValues: { approval_field: 'deleted_objectId' },
  },
  decorators: [withRedesignOn],
  parameters: {
    msw: {
      handlers: mrfFormViewWith([
        form_field_3,
        form_field_5,
        dropdown_field_valid_mapping,
      ]),
    },
  },
}
