import { Meta, StoryFn } from '@storybook/react-vite'

import { PaymentChannel } from 'formsg-shared/types'
import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from 'formsg-shared/types/form'

import {
  createFormBuilderMocks,
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

export const Loading = Template.bind({})
Loading.parameters = {
  msw: { handlers: { default: [getAdminFormSettings({ delay: 'infinite' })] } },
}
