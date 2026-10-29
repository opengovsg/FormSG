import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'

import { featureFlags } from 'formsg-shared/constants'
import { BasicField, PaymentChannel } from 'formsg-shared/types'
import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
  FormWorkflowStepDto,
  FormWorkflowStepWriteDto,
  WorkflowType,
} from 'formsg-shared/types/form'

import {
  createFormBuilderMocks,
  createMockForm,
  getAdminFormSettings,
  MOCK_FORM_FIELDS_WITH_MYINFO,
  patchAdminFormSettings,
  putFormWhitelistSettingSimulateCsvStringValidationError,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter, viewportModes } from '~utils/storybook'

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
  parameters: {},
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
  argos: { modes: viewportModes('tablet', 'mobile') },
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

// Multi-respondent forms get one collapsible section per workflow step once
// later steps can log in.
const stepLoginOn = new GrowthBook({
  features: {
    [featureFlags.mrfStepLogin]: { defaultValue: true },
    [featureFlags.workflowBuilderRedesign]: { defaultValue: true },
    [featureFlags.isNricFieldEnabled]: { defaultValue: true },
  },
})

const withStepLoginOn = (Story: StoryFn) => (
  <GrowthBookProvider growthbook={stepLoginOn}>
    <Story />
  </GrowthBookProvider>
)

const MRF_STEP_LOGIN_FORM: Partial<AdminFormDto> = {
  responseMode: FormResponseMode.Multirespondent,
  authType: FormAuthType.MyInfo,
  form_fields: [
    {
      title: 'Short answer',
      description: '',
      required: true,
      disabled: false,
      fieldType: BasicField.ShortText,
      _id: '6200e1534ad4f00012848d90',
      ValidationOptions: { customVal: null, selectedValidation: null },
      allowPrefill: false,
    },
  ],
  workflow: [
    {
      _id: '61e6857c9c794b0012f1c6f8',
      workflow_type: WorkflowType.Static,
      emails: [],
      edit: ['6200e1534ad4f00012848d90'],
      step_name: 'Applicant',
    },
    {
      _id: '61e6857c9c794b0012f1c6f9',
      workflow_type: WorkflowType.Static,
      emails: ['test_1@tech.gov.sg'],
      step_name: 'Approving officer',
      edit: [],
      auth: { auth_type: FormAuthType.CP, esrvc_id: 'STORYBOOK-TEST' },
    },
    {
      _id: '61e6857c9c794b0012f1c6fa',
      workflow_type: WorkflowType.Static,
      emails: ['test_2@tech.gov.sg'],
      step_name: 'Processing officer',
      edit: [],
    },
  ],
}

const buildMrfStepLoginMswRoutes = (overrides: Partial<FormSettings>) => {
  const current = createMockForm({
    ...MRF_STEP_LOGIN_FORM,
    status: overrides.status ?? FormStatus.Private,
  }).form
  return [
    http.get('/api/v3/admin/forms/:formId', () =>
      HttpResponse.json({ form: current }),
    ),
    http.get('/api/v3/admin/forms/:formId/settings', () =>
      HttpResponse.json(current),
    ),
    http.put(
      '/api/v3/admin/forms/:formId/workflow/:stepNumber',
      async ({ request, params }) => {
        if (current.responseMode !== FormResponseMode.Multirespondent)
          return new HttpResponse(null, { status: 400 })
        const { first_step_login, ...step } =
          (await request.json()) as FormWorkflowStepWriteDto
        delete step.delete_auth_field_ids
        delete step.expected_last_modified
        if (first_step_login) {
          current.authType = first_step_login.auth_type
          current.esrvcId = first_step_login.esrvc_id ?? ''
        }
        current.workflow[Number(params.stepNumber)] =
          step as FormWorkflowStepDto
        return HttpResponse.json(current.workflow)
      },
    ),
    ...createFormBuilderMocks({
      ...MRF_STEP_LOGIN_FORM,
      status: overrides.status ?? FormStatus.Private,
    }),
    patchAdminFormSettings({
      overrides: { authType: FormAuthType.MyInfo, ...overrides },
      mode: FormResponseMode.Multirespondent,
    }),
  ]
}

export const PrivateMrfStepLoginAccordion = Template.bind({})
PrivateMrfStepLoginAccordion.decorators = [withStepLoginOn]
PrivateMrfStepLoginAccordion.parameters = {
  msw: {
    handlers: {
      default: buildMrfStepLoginMswRoutes({ status: FormStatus.Private }),
    },
  },
}

export const PublicMrfStepLoginAccordion = Template.bind({})
PublicMrfStepLoginAccordion.decorators = [withStepLoginOn]
PublicMrfStepLoginAccordion.parameters = {
  msw: {
    handlers: {
      default: buildMrfStepLoginMswRoutes({ status: FormStatus.Public }),
    },
  },
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: { handlers: { default: [getAdminFormSettings({ delay: 'infinite' })] } },
}
