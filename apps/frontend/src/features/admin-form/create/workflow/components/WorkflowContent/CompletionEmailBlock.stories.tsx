import { useEffect } from 'react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'
import { http, HttpResponse } from 'msw'

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
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import {
  setToEditingEmailCardSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'

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
  patchAdminFormSettings({ mode: FormResponseMode.Multirespondent }),
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

/** Opens the card, for the stories that document its expanded state. */
const OpenedTemplate: StoryFn = () => {
  const setToEditingEmailCard = useAdminWorkflowStore(
    setToEditingEmailCardSelector,
  )
  // Resets on unmount, so switching between the Active and Inactive stories
  // does not leak an open card into the next one.
  useEffect(() => {
    setToEditingEmailCard()
    return () => useAdminWorkflowStore.getState().reset()
  }, [setToEditingEmailCard])
  return <CompletionEmailBlock />
}

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

export const Active = OpenedTemplate.bind({})
Active.parameters = {
  msw: { handlers: mocks(FULLY_CONFIGURED) },
  docs: {
    description: {
      story:
        'Expanded card. Commits on Save only, unlike Settings, which saves on blur.',
    },
  },
}

export const ActiveOnPublicForm = OpenedTemplate.bind({})
ActiveOnPublicForm.storyName = 'Active, form is public'
ActiveOnPublicForm.parameters = {
  msw: {
    handlers: mocks({ ...FULLY_CONFIGURED, status: FormStatus.Public }),
  },
  docs: {
    description: {
      story:
        'Editing recipients on a live form is blocked in the frontend today, so the card opens read-only with Save disabled and Cancel still usable. This state has no design yet.',
    },
  },
}

export const SettingsError = Template.bind({})
SettingsError.storyName = 'Settings request failed'
SettingsError.parameters = {
  // Overridden inline rather than by teaching the shared settings handler about
  // failures, which every other story would then carry.
  msw: {
    handlers: [
      mocks(NOTHING_CONFIGURED)[0],
      http.get('/api/v3/admin/forms/:formId/settings', () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 403 }),
      ),
    ],
  },
  docs: {
    description: {
      story:
        'With no recipients to summarise the card would skeleton indefinitely, since a failed request and one still in flight both leave the data undefined. Falls back to the message the flag-off path shows, so the admin still gets a working link to Settings.',
    },
  },
}
