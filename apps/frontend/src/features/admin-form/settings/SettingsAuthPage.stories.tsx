import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'
import { PaymentChannel } from 'formsg-shared/types'
import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
  FormWorkflowStepDto,
  WorkflowType,
} from 'formsg-shared/types/form'

import {
  createFormBuilderMocks,
  getAdminFormSettings,
  MOCK_FORM_FIELDS_WITH_MYINFO,
  patchAdminFormSettings,
  putFormWhitelistSettingSimulateCsvStringValidationError,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter, viewports } from '~utils/storybook'

import { SettingsAuthPage } from './SettingsAuthPage'

const DUMMY_STRIPE_PAYMENT_CHANNEL_VALUE = {
  channel: PaymentChannel.Stripe,
  target_account_id: 'dummy',
  publishable_key: 'dummy',
}

const buildEmailModeMswRoutes = (overrides?: Partial<FormSettings>) => [
  ...createFormBuilderMocks(),
  getAdminFormSettings({ overrides }),
  patchAdminFormSettings({ overrides }),
]

const buildEncryptModeMswRoutes = (overrides: Partial<FormSettings>) => [
  ...createFormBuilderMocks(),
  getAdminFormSettings({ overrides, mode: FormResponseMode.Encrypt }),
  patchAdminFormSettings({ overrides, mode: FormResponseMode.Encrypt }),
]

export default {
  title: 'Pages/AdminFormPage/Settings/AuthTab',
  component: SettingsAuthPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true, delay: 300 },
  },
} as Meta

const Template: StoryFn = () => <SettingsAuthPage />
export const PrivateEmailNilAuthForm = Template.bind({})
PrivateEmailNilAuthForm.parameters = {
  msw: {
    handlers: {
      default: buildEmailModeMswRoutes({ status: FormStatus.Private }),
    },
  },
}

export const PrivateStorageNilAuthForm = Template.bind({})
PrivateStorageNilAuthForm.parameters = {
  msw: {
    handlers: {
      default: buildEncryptModeMswRoutes({
        responseMode: FormResponseMode.Encrypt,
        status: FormStatus.Private,
      }),
    },
  },
}

export const PublicEmailNilAuthForm = Template.bind({})
PublicEmailNilAuthForm.parameters = {
  msw: {
    handlers: {
      default: buildEmailModeMswRoutes({
        responseMode: FormResponseMode.Email,
        status: FormStatus.Public,
      }),
    },
  },
}

export const PublicStorageNilAuthForm = Template.bind({})
PublicStorageNilAuthForm.parameters = {
  msw: {
    handlers: {
      default: buildEncryptModeMswRoutes({
        responseMode: FormResponseMode.Encrypt,
        status: FormStatus.Public,
      }),
    },
  },
}

export const PublicStorageNilAuthFormSubmitterIdCollectionEnabled =
  Template.bind({})
PublicStorageNilAuthFormSubmitterIdCollectionEnabled.parameters = {
  msw: {
    handlers: {
      default: buildEncryptModeMswRoutes({
        responseMode: FormResponseMode.Encrypt,
        status: FormStatus.Public,
        isSubmitterIdCollectionEnabled: true,
      }),
    },
  },
}

export const PrivateStorageCorppassForm = Template.bind({})
PrivateStorageCorppassForm.parameters = {
  msw: {
    handlers: {
      default: buildEncryptModeMswRoutes({
        status: FormStatus.Private,
        authType: FormAuthType.CP,
        esrvcId: 'STORYBOOK-TEST',
        responseMode: FormResponseMode.Encrypt,
      }),
    },
  },
}

export const PublicEmailSingpassForm = Template.bind({})
PublicEmailSingpassForm.parameters = {
  msw: {
    handlers: {
      default: buildEmailModeMswRoutes({
        status: FormStatus.Public,
        authType: FormAuthType.MyInfo,
        esrvcId: 'STORYBOOK-TEST',
        responseMode: FormResponseMode.Email,
      }),
    },
  },
}

export const PrivateEmailMyInfoWithoutMyInfoFieldsForm = Template.bind({})
PrivateEmailMyInfoWithoutMyInfoFieldsForm.parameters = {
  msw: {
    handlers: {
      default: [
        ...buildEmailModeMswRoutes({
          status: FormStatus.Private,
          authType: FormAuthType.MyInfo,
          esrvcId: 'STORYBOOK-TEST',
        }),
        ...createFormBuilderMocks({ form_fields: [] }),
      ],
    },
  },
}

export const PrivateEmailMyinfoForm = Template.bind({})
PrivateEmailMyinfoForm.parameters = {
  msw: {
    handlers: {
      default: [
        ...buildEmailModeMswRoutes({
          status: FormStatus.Private,
          authType: FormAuthType.MyInfo,
          esrvcId: 'STORYBOOK-TEST',
        }),
        ...createFormBuilderMocks({
          form_fields: MOCK_FORM_FIELDS_WITH_MYINFO,
        }),
      ],
    },
  },
}

export const PublicEmailMyInfoForm = Template.bind({})
PublicEmailMyInfoForm.parameters = {
  msw: {
    handlers: {
      default: [
        ...buildEmailModeMswRoutes({
          status: FormStatus.Public,
          authType: FormAuthType.MyInfo,
          esrvcId: 'STORYBOOK-TEST',
        }),
        ...createFormBuilderMocks({
          form_fields: MOCK_FORM_FIELDS_WITH_MYINFO,
        }),
      ],
    },
  },
}

export const PrivateEmailMyInfoFormSubmitterIdCollectionEnabled = Template.bind(
  {},
)
PrivateEmailMyInfoFormSubmitterIdCollectionEnabled.parameters = {
  msw: {
    handlers: {
      default: [
        ...buildEmailModeMswRoutes({
          status: FormStatus.Private,
          authType: FormAuthType.MyInfo,
          esrvcId: 'STORYBOOK-TEST',
          isSubmitterIdCollectionEnabled: true,
        }),
        ...createFormBuilderMocks({
          form_fields: MOCK_FORM_FIELDS_WITH_MYINFO,
        }),
      ],
    },
  },
}

export const PrivateEmailSingpassFormSingleSubmissionEnabled = Template.bind({})
PrivateEmailSingpassFormSingleSubmissionEnabled.parameters = {
  msw: {
    handlers: {
      default: buildEmailModeMswRoutes({
        status: FormStatus.Private,
        authType: FormAuthType.MyInfo,
        isSingleSubmission: true,
      }),
    },
  },
}

// purpose: displays all available singpass settings in an enabled state
export const PrivateStorageSingpassFormAllTogglesEnabled = Template.bind({})
PrivateStorageSingpassFormAllTogglesEnabled.parameters = {
  msw: {
    handlers: {
      default: buildEncryptModeMswRoutes({
        status: FormStatus.Private,
        authType: FormAuthType.MyInfo,
        isSingleSubmission: true,
        isSubmitterIdCollectionEnabled: true,
      }),
    },
  },
}

export const PublicEmailCorppassAllTogglesEnabledForm = Template.bind({})
PublicEmailCorppassAllTogglesEnabledForm.parameters = {
  msw: {
    handlers: {
      default: buildEmailModeMswRoutes({
        status: FormStatus.Public,
        authType: FormAuthType.CP,
        isSingleSubmission: true,
        isSubmitterIdCollectionEnabled: true,
      }),
    },
  },
}

export const PrivateStorageMyInfoPaymentEnabledForm = Template.bind({})
PrivateStorageMyInfoPaymentEnabledForm.parameters = {
  msw: {
    handlers: {
      default: [
        ...buildEncryptModeMswRoutes({
          status: FormStatus.Private,
          authType: FormAuthType.MyInfo,
          esrvcId: 'STORYBOOK-TEST',
          responseMode: FormResponseMode.Encrypt,
          payments_channel: DUMMY_STRIPE_PAYMENT_CHANNEL_VALUE,
        }),
        ...createFormBuilderMocks({
          form_fields: MOCK_FORM_FIELDS_WITH_MYINFO,
        }),
      ],
    },
  },
}

export const PublicStorageMyInfoPaymentEnabledForm = Template.bind({})
PublicStorageMyInfoPaymentEnabledForm.parameters = {
  msw: {
    handlers: {
      default: [
        ...buildEncryptModeMswRoutes({
          status: FormStatus.Public,
          authType: FormAuthType.MyInfo,
          esrvcId: 'STORYBOOK-TEST',
          responseMode: FormResponseMode.Encrypt,
          payments_channel: DUMMY_STRIPE_PAYMENT_CHANNEL_VALUE,
        }),
        ...createFormBuilderMocks({
          form_fields: MOCK_FORM_FIELDS_WITH_MYINFO,
        }),
      ],
    },
  },
}

// stories for whitelist setting
export const PrivateStorageMyInfoWhitelistEnabledForm = Template.bind({})
PrivateStorageMyInfoWhitelistEnabledForm.parameters = {
  msw: {
    handlers: {
      default: [
        ...buildEncryptModeMswRoutes({
          status: FormStatus.Private,
          authType: FormAuthType.MyInfo,
          responseMode: FormResponseMode.Encrypt,
          whitelistedSubmitterIds: {
            isWhitelistEnabled: true,
          },
        }),
      ],
    },
  },
}

export const PrivateStorageMyInfoUpdateWhitelistValidationErrorForm =
  Template.bind({})
PrivateStorageMyInfoUpdateWhitelistValidationErrorForm.parameters = {
  msw: {
    handlers: {
      default: [
        ...buildEncryptModeMswRoutes({
          status: FormStatus.Private,
          authType: FormAuthType.MyInfo,
          responseMode: FormResponseMode.Encrypt,
          whitelistedSubmitterIds: {
            isWhitelistEnabled: false,
          },
        }),
        putFormWhitelistSettingSimulateCsvStringValidationError('12345'),
      ],
      docs: {
        description: {
          story:
            'Uploading a valid CSV file should display a mock validation error. This story is used to simulate validation errors are displayed correctly in the UI.',
        },
      },
    },
  },
}

// Login on every step (mrf-singpass-all-steps): Settings › Singpass for MRF
// forms is a read-only summary with Edit links into the Workflow tab.
const stepLoginOn = new GrowthBook({
  features: { [featureFlags.mrfSingpassAllSteps]: { defaultValue: true } },
})

const withStepLoginOn = (Story: StoryFn) => (
  <GrowthBookProvider growthbook={stepLoginOn}>
    <Story />
  </GrowthBookProvider>
)

const STEP_LOGIN_WORKFLOW: FormWorkflowStepDto[] = [
  {
    _id: '6a1000000000000000000001',
    workflow_type: WorkflowType.Static,
    emails: [],
    edit: [],
  },
  {
    _id: '6a1000000000000000000002',
    workflow_type: WorkflowType.Static,
    emails: ['applicant@example.com'],
    edit: [],
    step_name: 'Applicant',
    auth: {
      auth_type: FormAuthType.MyInfo,
      is_submitter_id_collection_enabled: true,
    },
  },
  {
    _id: '6a1000000000000000000003',
    workflow_type: WorkflowType.Static,
    emails: ['hr@company.sg'],
    edit: [],
    auth: {
      auth_type: FormAuthType.CP,
      is_submitter_id_collection_enabled: true,
      whitelisted_submitter_ids: { isWhitelistEnabled: true },
    },
  },
]

const buildMrfMswRoutes = (overrides: Partial<AdminFormDto>) => [
  ...createFormBuilderMocks({
    responseMode: FormResponseMode.Multirespondent,
    ...overrides,
  } as Partial<AdminFormDto>),
  getAdminFormSettings({
    overrides: overrides as Partial<FormSettings>,
    mode: FormResponseMode.Multirespondent,
  }),
]

export const MrfStepLoginOverview = Template.bind({})
MrfStepLoginOverview.decorators = [withStepLoginOn]
MrfStepLoginOverview.parameters = {
  msw: {
    handlers: {
      default: buildMrfMswRoutes({
        status: FormStatus.Private,
        authType: FormAuthType.NIL,
        esrvcId: 'FORMSG-CP-DEMO',
        workflow: STEP_LOGIN_WORKFLOW,
      } as Partial<AdminFormDto>),
    },
  },
}

export const MrfStepLoginOverviewNoSteps = Template.bind({})
MrfStepLoginOverviewNoSteps.decorators = [withStepLoginOn]
MrfStepLoginOverviewNoSteps.parameters = {
  msw: {
    handlers: {
      default: buildMrfMswRoutes({
        status: FormStatus.Private,
        authType: FormAuthType.MyInfo,
        isSubmitterIdCollectionEnabled: true,
        isSingleSubmission: true,
        workflow: [],
      } as Partial<AdminFormDto>),
    },
  },
}

export const MrfStepLoginFlagOff = Template.bind({})
MrfStepLoginFlagOff.parameters = MrfStepLoginOverview.parameters

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: {
    handlers: {
      default:
        PrivateStorageSingpassFormAllTogglesEnabled.parameters.msw.handlers
          .default,
    },
  },
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: {
    handlers: {
      default:
        PrivateStorageSingpassFormAllTogglesEnabled.parameters.msw.handlers
          .default,
    },
  },
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: { handlers: { default: [getAdminFormSettings({ delay: 'infinite' })] } },
}
