import { Meta, StoryFn } from '@storybook/react'

import {
  FormResponseMode,
  FormSettings,
  PaymentChannel,
  PaymentType,
} from 'formsg-shared/types'

import {
  getAdminFormSettings,
  getAdminFormStripeValidate,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { SettingsPaymentsPage } from './SettingsPaymentsPage'

const buildEncryptModeMswRoutes = (overrides?: Partial<FormSettings>) => [
  getAdminFormSettings({ overrides, mode: FormResponseMode.Encrypt }),
  patchAdminFormSettings({ overrides, mode: FormResponseMode.Encrypt }),
]

const buildMrfModeMswRoutes = (overrides?: Partial<FormSettings>) => [
  getAdminFormSettings({
    overrides,
    mode: FormResponseMode.Multirespondent,
  }),
  patchAdminFormSettings({
    overrides,
    mode: FormResponseMode.Multirespondent,
  }),
  getAdminFormStripeValidate(),
]

const MRF_STRIPE_CONNECTED_OVERRIDES: Partial<FormSettings> = {
  payments_channel: {
    channel: PaymentChannel.Stripe,
    target_account_id: 'acct_mock123',
    publishable_key: 'pk_test_mock123',
    payment_methods: [],
  },
}

const MRF_LIVE_PAYMENT_OVERRIDES: Partial<FormSettings> = {
  ...MRF_STRIPE_CONNECTED_OVERRIDES,
  payments_field: {
    enabled: true,
    payment_type: PaymentType.Products,
    products: [],
  },
}

export default {
  title: 'Pages/AdminFormPage/Settings/PaymentsTab',
  component: SettingsPaymentsPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    msw: { handlers: { default: buildEncryptModeMswRoutes() } },
  },
} as Meta

const Template: StoryFn = () => <SettingsPaymentsPage />
export const IsSingleSubmissionEnabledWithoutEmailNotifications = Template.bind(
  {},
)
IsSingleSubmissionEnabledWithoutEmailNotifications.parameters = {
  msw: {
    handlers: {
      default: buildEncryptModeMswRoutes({
        isSingleSubmission: true,
        emails: [],
      }),
    },
  },
}

export const IsSingleSubmissionEnabledWithEmailNotifications = Template.bind({})
IsSingleSubmissionEnabledWithEmailNotifications.parameters = {
  msw: {
    handlers: {
      default: buildEncryptModeMswRoutes({
        isSingleSubmission: true,
        emails: ['dummy@dummy.com'],
      }),
    },
  },
}

export const IsSingleSubmissionDisabledWithoutEmailNotifications =
  Template.bind({})
IsSingleSubmissionDisabledWithoutEmailNotifications.parameters = {
  msw: {
    handlers: {
      default: buildEncryptModeMswRoutes({
        isSingleSubmission: false,
        emails: [],
      }),
    },
  },
}

// The MRF stories render without a GrowthBookProvider, so the mrf-payments
// flag resolves to off — they exercise the kill-switch UI states.

export const MrfWithFlagOffShowsUnsupportedMsg = Template.bind({})
MrfWithFlagOffShowsUnsupportedMsg.parameters = {
  msw: {
    handlers: {
      default: buildMrfModeMswRoutes(),
    },
  },
}

export const MrfStripeConnectedWithFlagOffKeepsUnlink = Template.bind({})
MrfStripeConnectedWithFlagOffKeepsUnlink.parameters = {
  msw: {
    handlers: {
      default: buildMrfModeMswRoutes(MRF_STRIPE_CONNECTED_OVERRIDES),
    },
  },
}

export const MrfLivePaymentWithFlagOffKeepsSettings = Template.bind({})
MrfLivePaymentWithFlagOffKeepsSettings.parameters = {
  msw: {
    handlers: {
      default: buildMrfModeMswRoutes(MRF_LIVE_PAYMENT_OVERRIDES),
    },
  },
}
