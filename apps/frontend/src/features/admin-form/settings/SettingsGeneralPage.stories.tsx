import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { featureFlags } from 'formsg-shared/constants'
import {
  AdminFormDto,
  BasicField,
  CorppassAttribute,
  DateString,
  FormAuthType,
  FormFieldDto,
  FormStatus,
  FormWorkflowStepDto,
  WorkflowType,
} from 'formsg-shared/types'
import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

import {
  createFormBuilderMocks,
  getAdminFormSettings,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter, viewportModes } from '~utils/storybook'

import { SettingsGeneralPage } from './SettingsGeneralPage'

const buildMswRoutes = ({
  overrides,
  delay,
}: {
  overrides?: Partial<FormSettings>
  delay?: number | 'infinite'
} = {}) => [
  getAdminFormSettings({ overrides, delay }),
  patchAdminFormSettings({ overrides }),
]

const scheduledClosureOn = new GrowthBook({
  features: { [featureFlags.scheduledFormClosure]: { defaultValue: true } },
})

export default {
  title: 'Pages/AdminFormPage/Settings/General',
  component: SettingsGeneralPage,
  decorators: [
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
    (Story) => (
      <GrowthBookProvider growthbook={scheduledClosureOn}>
        <Story />
      </GrowthBookProvider>
    ),
  ],
  parameters: {
    msw: {
      handlers: {
        default: buildMswRoutes({
          overrides: { responseMode: FormResponseMode.Encrypt },
        }),
      },
    },
  },
} as Meta

const Template: StoryFn = () => <SettingsGeneralPage />

/** Expiry toggle off — the date picker is hidden until the admin opts in. */
export const NoScheduledClosure = Template.bind({})

/** Expiry toggle on, showing the date picker pre-filled with a close date. */
export const WithScheduledClosure = Template.bind({})
WithScheduledClosure.parameters = {
  argos: { modes: viewportModes('mobile') },
  msw: {
    handlers: {
      default: buildMswRoutes({
        overrides: {
          responseMode: FormResponseMode.Encrypt,
          closeAt: '2026-12-31T15:59:59.999Z' as DateString,
        },
      }),
    },
  },
}

/** Both auto-close triggers set, to check they read as independent. */
export const WithResponseLimitAndScheduledClosure = Template.bind({})
WithResponseLimitAndScheduledClosure.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        overrides: {
          responseMode: FormResponseMode.Encrypt,
          submissionLimit: 1000,
          closeAt: '2026-12-31T15:59:59.999Z' as DateString,
        },
      }),
    },
  },
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: { handlers: { default: buildMswRoutes({ delay: 'infinite' }) } },
}

const draftLoginFields: FormFieldDto[] = [
  {
    _id: '620115cf3bc125001349fa01',
    title: 'Requester name',
    description: '',
    fieldType: BasicField.ShortText,
    required: true,
    disabled: false,
    ValidationOptions: { selectedValidation: null, customVal: null },
  },
  {
    _id: '620115cf3bc125001349fa02',
    title: 'Company UEN',
    description: '',
    fieldType: BasicField.Uen,
    required: true,
    disabled: false,
    corppass: { attr: CorppassAttribute.Uen },
  },
]
const authenticationDraftParameters = (isAssigned: boolean) => {
  const workflow: FormWorkflowStepDto[] = [
    {
      _id: '61e6857c9c794b0012f1fa01',
      workflow_type: WorkflowType.Static,
      step_name: 'Requester',
      emails: [],
      edit: [draftLoginFields[0]._id],
    },
    {
      _id: '61e6857c9c794b0012f1fa02',
      workflow_type: WorkflowType.Static,
      step_name: 'Company representative',
      emails: ['representative@example.gov.sg'],
      edit: isAssigned ? [draftLoginFields[1]._id] : [],
      auth: { auth_type: FormAuthType.CP, esrvc_id: 'demo-service' },
    },
  ]
  const overrides: Partial<AdminFormDto> = {
    responseMode: FormResponseMode.Multirespondent,
    status: FormStatus.Private,
    authType: FormAuthType.NIL,
    isSubmitterIdCollectionEnabled: false,
    workflow,
    form_fields: draftLoginFields,
  }
  return {
    msw: {
      handlers: [
        ...createFormBuilderMocks(overrides),
        getAdminFormSettings({
          mode: FormResponseMode.Multirespondent,
          overrides: {
            responseMode: FormResponseMode.Multirespondent,
            status: FormStatus.Private,
            authType: FormAuthType.NIL,
          },
        }),
        patchAdminFormSettings({ mode: FormResponseMode.Multirespondent }),
      ],
    },
  }
}
/** A draft can keep the UEN field, but publication waits for its matching owner. */
export const AuthenticationDraftNotReady = Template.bind({})
AuthenticationDraftNotReady.parameters = authenticationDraftParameters(false)
export const AuthenticationReadyToPublish = Template.bind({})
AuthenticationReadyToPublish.parameters = authenticationDraftParameters(true)
