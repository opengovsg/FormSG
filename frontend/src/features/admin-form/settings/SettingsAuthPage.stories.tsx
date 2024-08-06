import { Meta, Story } from '@storybook/react'

import { PaymentChannel } from '~shared/types'
import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from '~shared/types/form'

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
  getAdminFormSettings({ overrides }),
  patchAdminFormSettings({ overrides }),
]

const buildEncryptModeMswRoutes = (overrides: Partial<FormSettings>) => [
  getAdminFormSettings({ overrides, mode: FormResponseMode.Encrypt }),
  patchAdminFormSettings({ overrides, mode: FormResponseMode.Encrypt }),
]

export default {
  title: 'Pages/AdminFormPage/Settings/AuthTab',
  component: SettingsAuthPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: buildEmailModeMswRoutes(),
  },
} as Meta

const Template: Story = () => <SettingsAuthPage />
export const PrivateEmailNilAuthForm = Template.bind({})
PrivateEmailNilAuthForm.parameters = {
  msw: buildEmailModeMswRoutes({ status: FormStatus.Private }),
}

export const PrivateStorageNilAuthForm = Template.bind({})
PrivateStorageNilAuthForm.parameters = {
  msw: buildEncryptModeMswRoutes({
    responseMode: FormResponseMode.Encrypt,
    status: FormStatus.Private,
  }),
}

export const PublicEmailNilAuthForm = Template.bind({})
PublicEmailNilAuthForm.parameters = {
  msw: buildEmailModeMswRoutes({
    responseMode: FormResponseMode.Email,
    status: FormStatus.Public,
  }),
}

export const PublicStorageNilAuthForm = Template.bind({})
PublicStorageNilAuthForm.parameters = {
  msw: buildEncryptModeMswRoutes({
    responseMode: FormResponseMode.Encrypt,
    status: FormStatus.Public,
  }),
}

export const PublicStorageNilAuthFormSubmitterIdCollectionEnabled =
  Template.bind({})
PublicStorageNilAuthFormSubmitterIdCollectionEnabled.parameters = {
  msw: buildEncryptModeMswRoutes({
    responseMode: FormResponseMode.Encrypt,
    status: FormStatus.Public,
    isSubmitterIdCollectionEnabled: true,
  }),
}

export const PrivateStorageCorppassForm = Template.bind({})
PrivateStorageCorppassForm.parameters = {
  msw: buildEncryptModeMswRoutes({
    status: FormStatus.Private,
    authType: FormAuthType.CP,
    esrvcId: 'STORYBOOK-TEST',
    responseMode: FormResponseMode.Encrypt,
  }),
}

export const PublicEmailSingpassForm = Template.bind({})
PublicEmailSingpassForm.parameters = {
  msw: buildEmailModeMswRoutes({
    status: FormStatus.Public,
    authType: FormAuthType.SP,
    esrvcId: 'STORYBOOK-TEST',
    responseMode: FormResponseMode.Email,
  }),
}

export const PrivateEmailMyInfoWithoutMyInfoFieldsForm = Template.bind({})
PrivateEmailMyInfoWithoutMyInfoFieldsForm.parameters = {
  msw: [
    ...buildEmailModeMswRoutes({
      status: FormStatus.Private,
      authType: FormAuthType.MyInfo,
      esrvcId: 'STORYBOOK-TEST',
    }),
    ...createFormBuilderMocks({ form_fields: [] }),
  ],
}

export const PrivateEmailMyinfoForm = Template.bind({})
PrivateEmailMyinfoForm.parameters = {
  msw: [
    ...buildEmailModeMswRoutes({
      status: FormStatus.Private,
      authType: FormAuthType.MyInfo,
      esrvcId: 'STORYBOOK-TEST',
    }),
    ...createFormBuilderMocks({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
  ],
}

export const PublicEmailMyInfoForm = Template.bind({})
PublicEmailMyInfoForm.parameters = {
  msw: [
    ...buildEmailModeMswRoutes({
      status: FormStatus.Public,
      authType: FormAuthType.MyInfo,
      esrvcId: 'STORYBOOK-TEST',
    }),
    ...createFormBuilderMocks({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
  ],
}

export const PrivateEmailSingpassFormSubmitterIdCollectionEnabled =
  Template.bind({})
PrivateEmailSingpassFormSubmitterIdCollectionEnabled.parameters = {
  msw: buildEmailModeMswRoutes({
    status: FormStatus.Private,
    authType: FormAuthType.SGID,
    isSubmitterIdCollectionEnabled: true,
  }),
}
export const PrivateEmailMyInfoFormSubmitterIdCollectionEnabled = Template.bind(
  {},
)
PrivateEmailMyInfoFormSubmitterIdCollectionEnabled.parameters = {
  msw: [
    ...buildEmailModeMswRoutes({
      status: FormStatus.Private,
      authType: FormAuthType.MyInfo,
      esrvcId: 'STORYBOOK-TEST',
      isSubmitterIdCollectionEnabled: true,
    }),
    ...createFormBuilderMocks({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
  ],
}

export const PrivateEmailSingpassFormSingleSubmissionEnabled = Template.bind({})
PrivateEmailSingpassFormSingleSubmissionEnabled.parameters = {
  msw: buildEmailModeMswRoutes({
    status: FormStatus.Private,
    authType: FormAuthType.SGID,
    isSingleSubmission: true,
  }),
}

// purpose: displays all available singpass settings in an enabled state
export const PrivateStorageSingpassFormAllTogglesEnabled = Template.bind({})
PrivateStorageSingpassFormAllTogglesEnabled.parameters = {
  msw: buildEncryptModeMswRoutes({
    status: FormStatus.Private,
    authType: FormAuthType.SGID,
    isSingleSubmission: true,
    isSubmitterIdCollectionEnabled: true,
  }),
}

export const PublicEmailCorppassAllTogglesEnabledForm = Template.bind({})
PublicEmailCorppassAllTogglesEnabledForm.parameters = {
  msw: buildEmailModeMswRoutes({
    status: FormStatus.Public,
    authType: FormAuthType.CP,
    isSingleSubmission: true,
    isSubmitterIdCollectionEnabled: true,
  }),
}

export const PrivateStorageMyInfoPaymentEnabledForm = Template.bind({})
PrivateStorageMyInfoPaymentEnabledForm.parameters = {
  msw: [
    ...buildEncryptModeMswRoutes({
      status: FormStatus.Private,
      authType: FormAuthType.MyInfo,
      esrvcId: 'STORYBOOK-TEST',
      responseMode: FormResponseMode.Encrypt,
      payments_channel: DUMMY_STRIPE_PAYMENT_CHANNEL_VALUE,
    }),
    ...createFormBuilderMocks({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
  ],
}

export const PublicStorageMyInfoPaymentEnabledForm = Template.bind({})
PublicStorageMyInfoPaymentEnabledForm.parameters = {
  msw: [
    ...buildEncryptModeMswRoutes({
      status: FormStatus.Public,
      authType: FormAuthType.MyInfo,
      esrvcId: 'STORYBOOK-TEST',
      responseMode: FormResponseMode.Encrypt,
      payments_channel: DUMMY_STRIPE_PAYMENT_CHANNEL_VALUE,
    }),
    ...createFormBuilderMocks({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
  ],
}

export const PrivateStorageSgidPaymentEnabledForm = Template.bind({})
PrivateStorageSgidPaymentEnabledForm.parameters = {
  msw: [
    ...buildEncryptModeMswRoutes({
      status: FormStatus.Private,
      authType: FormAuthType.SGID,
      responseMode: FormResponseMode.Encrypt,
      payments_channel: DUMMY_STRIPE_PAYMENT_CHANNEL_VALUE,
    }),
  ],
}

// stories for whitelist setting
export const PrivateStorageSgidWhitelistEnabledForm = Template.bind({})
PrivateStorageSgidWhitelistEnabledForm.parameters = {
  msw: [
    ...buildEncryptModeMswRoutes({
      status: FormStatus.Private,
      authType: FormAuthType.SGID,
      responseMode: FormResponseMode.Encrypt,
      whitelistedSubmitterIds: {
        isWhitelistEnabled: true,
      },
    }),
  ],
}

export const PrivateStorageMyInfoUpdateWhitelistValidationErrorForm =
  Template.bind({})
PrivateStorageMyInfoUpdateWhitelistValidationErrorForm.parameters = {
  msw: [
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
}

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: PrivateStorageSingpassFormAllTogglesEnabled.parameters.msw,
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: PrivateStorageSingpassFormAllTogglesEnabled.parameters.msw,
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [getAdminFormSettings({ delay: 'infinite' })],
}
