import { Meta, StoryFn } from '@storybook/react-vite'

import {
  AdminFormDto,
  BasicField,
  CorppassAttribute,
  DateString,
  FormAuthType,
  FormFieldDto,
  FormOrigin,
  FormStatus,
  FormWorkflowStepDto,
  WorkflowType,
} from 'formsg-shared/types'
import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

import {
  createFormBuilderMocks,
  getAdminFormSettings,
  getAdminFormSubmissions,
  getAdminFormView,
  patchAdminFormSettings,
  putAdminFormOrigins,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter, viewportModes } from '~utils/storybook'

import { SettingsGeneralPage } from './SettingsGeneralPage'

const buildMswRoutes = ({
  overrides,
  delay,
  mode,
  metadata,
}: {
  overrides?: Partial<FormSettings>
  delay?: number | 'infinite'
  mode?: FormResponseMode
  metadata?: AdminFormDto['metadata']
} = {}) => [
  getAdminFormSettings({ overrides, delay, mode }),
  patchAdminFormSettings({ overrides, mode }),
  getAdminFormView({ mode, overrides: metadata && { metadata } }),
  getAdminFormSubmissions(),
  putAdminFormOrigins(),
]

export default {
  title: 'Pages/AdminFormPage/Settings/General',
  component: SettingsGeneralPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
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
const authenticationDraftParameters = (
  isAssigned: boolean,
  hasProvider = true,
  esrvcId = 'demo-service',
) => {
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
      auth: hasProvider
        ? { auth_type: FormAuthType.CP, esrvc_id: esrvcId }
        : undefined,
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
/** Recovery state for an existing inconsistent form with no matching provider. */
export const AuthenticationDraftNotReady = Template.bind({})
AuthenticationDraftNotReady.parameters = authenticationDraftParameters(
  false,
  false,
)
export const AuthenticationReadyToPublish = Template.bind({})
AuthenticationReadyToPublish.parameters = authenticationDraftParameters(true)

/** The Corppass requirement is a description inside the closed-form status box. */
export const MissingCorppassServiceId = Template.bind({})
MissingCorppassServiceId.parameters = authenticationDraftParameters(
  false,
  true,
  '',
)

const paperTrackingOn = new GrowthBook({
  features: {
    [featureFlags.scheduledFormClosure]: { defaultValue: true },
    [featureFlags.enablePaperTrackingSetUpPage]: { defaultValue: true },
  },
})

const closedStorageForm = {
  mode: FormResponseMode.Encrypt,
  overrides: { status: FormStatus.Private },
}

/**
 * A closed storage form that was never asked the origin question. Turning
 * it on asks "Before FormSG, how did you collect this?" before the key.
 */
export const OpeningFormWithoutOrigin = Template.bind({})
OpeningFormWithoutOrigin.decorators = [
  (Story) => (
    <GrowthBookProvider growthbook={paperTrackingOn}>
      <Story />
    </GrowthBookProvider>
  ),
]
OpeningFormWithoutOrigin.parameters = {
  msw: { handlers: { default: buildMswRoutes(closedStorageForm) } },
}

/** A closed storage form that already has an origin opens with the key only. */
export const OpeningFormWithOrigin = Template.bind({})
OpeningFormWithOrigin.decorators = OpeningFormWithoutOrigin.decorators
OpeningFormWithOrigin.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        ...closedStorageForm,
        metadata: { formOrigins: { value: [FormOrigin.Paper] } },
      }),
    },
  },
}
