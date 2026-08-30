import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'
import {
  BasicField,
  FormFieldDto,
  FormResponseMode,
  FormWorkflowStepDto,
  WorkflowType,
} from 'formsg-shared/types'
import {
  FormStatus,
  MultirespondentFormSettings,
} from 'formsg-shared/types/form'

import {
  getAdminFormSettings,
  getAdminFormView,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { CompletionEmailBlock } from './CompletionEmailBlock'

const emailField: FormFieldDto = {
  title: 'Your email',
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

const yesNoField: FormFieldDto = {
  title: 'Approve time off?',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '620115cf3bc125001349f9c3',
}

const step1: FormWorkflowStepDto = {
  _id: '61e6857c9c794b0012f1c6f8',
  workflow_type: WorkflowType.Static,
  emails: [],
  edit: [emailField._id],
}

const step2: FormWorkflowStepDto = {
  _id: '61e6857c9c794b0012f1c6f9',
  workflow_type: WorkflowType.Static,
  emails: ['approver@example.gov.sg'],
  edit: [yesNoField._id],
  step_name: 'Approver',
}

const redesignOn = new GrowthBook({
  features: { [featureFlags.workflowBuilderRedesign]: { defaultValue: true } },
})

const mocks = (
  settingsOverrides: Partial<MultirespondentFormSettings>,
  settingsDelay: number | 'infinite' = 0,
) => [
  getAdminFormView({
    mode: FormResponseMode.Multirespondent,
    overrides: {
      form_fields: [emailField, yesNoField],
      workflow: [step1, step2],
    },
  }),
  getAdminFormSettings({
    mode: FormResponseMode.Multirespondent,
    delay: settingsDelay,
    overrides: {
      // The shared mock form is Public by default, which would render every
      // story read-only. Editable stories must say so explicitly.
      status: FormStatus.Private,
      ...settingsOverrides,
    },
  }),
]

const NOTHING_CONFIGURED = {
  emails: [],
  stepsToNotify: [],
  stepOneEmailNotificationFieldId: '',
}

const FULLY_CONFIGURED = {
  emails: ['admin@example.gov.sg', 'records@example.gov.sg'],
  stepsToNotify: [step2._id],
  stepOneEmailNotificationFieldId: emailField._id,
}

export default {
  component: CompletionEmailBlock,
  title:
    'Features/AdminForm/create/workflow/components/WorkflowContent/CompletionEmailBlock',
  decorators: [
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
    (Story: StoryFn) => (
      <GrowthBookProvider growthbook={redesignOn}>
        <Story />
      </GrowthBookProvider>
    ),
  ],
} as Meta

const Template: StoryFn = () => <CompletionEmailBlock />

export const InactiveEmpty = Template.bind({})
InactiveEmpty.storyName = 'Inactive, nothing configured'
InactiveEmpty.parameters = {
  msw: { handlers: mocks(NOTHING_CONFIGURED) },
  docs: {
    description: {
      story:
        'The state every new MRF form starts in, since the recipient fields all default to empty. Shows the Settings instruction rather than an absence message.',
    },
  },
}

export const InactiveConfigured = Template.bind({})
InactiveConfigured.storyName = 'Inactive, recipients configured'
InactiveConfigured.parameters = {
  msw: { handlers: mocks(FULLY_CONFIGURED) },
  docs: {
    description: {
      story:
        'Summarises all three recipient groups. Notified steps read in workflow order, not the order the ids happen to be stored in.',
    },
  },
}

export const Loading = Template.bind({})
Loading.storyName = 'Loading, settings not yet arrived'
Loading.parameters = {
  msw: { handlers: mocks(FULLY_CONFIGURED, 'infinite') },
  docs: {
    description: {
      story:
        'The form resolves before its settings, so the divider, card frame and label are already in place while the recipient list is still on its way. Only the list is skeletoned.',
    },
  },
}
