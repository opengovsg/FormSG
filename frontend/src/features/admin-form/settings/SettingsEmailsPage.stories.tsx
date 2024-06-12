import { Meta, Story } from '@storybook/react'

import { PaymentChannel, PaymentType } from '~shared/types'
import { FormResponseMode, FormSettings, FormStatus } from '~shared/types/form'

import {
  getAdminFormSettings,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'
import { createMockForm } from '~/mocks/msw/handlers/admin-form/form'

import {
  getMobileViewParameters,
  StoryRouter,
  viewports,
} from '~utils/storybook'

import { SettingsEmailsPage } from './SettingsEmailsPage'

const PAYMENTS_ENABLED = {
  payments_channel: {
    channel: PaymentChannel.Stripe,
    target_account_id: 'target-account-id',
    publishable_key: 'publishable-key',
    payment_methods: [],
  },
  payments_field: {
    enabled: true,
    description: 'description',
    name: 'name',
    amount_cents: 1,
    min_amount: 1,
    max_amount: 1,
    payment_type: PaymentType.Products,
    global_min_amount_override: 0,
    gst_enabled: true,
    products: [],
    products_meta: {
      multi_product: false,
    },
  },
}

const PAYMENTS_DISABLED = {
  payments_channel: {
    channel: PaymentChannel.Unconnected,
    target_account_id: '',
    publishable_key: '',
    payment_methods: [],
  },
  payments_field: {
    enabled: false,
    description: '',
    name: '',
    amount_cents: 0,
    min_amount: 0,
    max_amount: 0,
    payment_type: PaymentType.Products,
    global_min_amount_override: 0,
    gst_enabled: true,
    products: [],
    products_meta: {
      multi_product: false,
    },
  },
}

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

export default {
  title: 'Pages/AdminFormPage/Settings/Emails',
  component: SettingsEmailsPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: buildMswRoutes(),
  },
} as Meta

const Template: Story = () => <SettingsEmailsPage />

export const PrivateStorageForm = Template.bind({})
PrivateStorageForm.parameters = {
  msw: buildMswRoutes({
    overrides: {
      responseMode: FormResponseMode.Encrypt,
      status: FormStatus.Private,
      ...PAYMENTS_DISABLED,
    },
  }),
}

export const PrivateEmailForm = Template.bind({})
PrivateEmailForm.parameters = {
  msw: buildMswRoutes({
    overrides: {
      responseMode: FormResponseMode.Email,
      status: FormStatus.Private,
      ...PAYMENTS_DISABLED,
    },
  }),
}

export const PublicForm = Template.bind({})
PublicForm.parameters = {
  msw: buildMswRoutes({
    overrides: {
      status: FormStatus.Public,
      ...PAYMENTS_DISABLED,
    },
  }),
}

export const PaymentForm = Template.bind({})
PaymentForm.parameters = {
  msw: buildMswRoutes({
    overrides: {
      status: FormStatus.Private,
      ...PAYMENTS_ENABLED,
    },
  }),
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: buildMswRoutes({ delay: 'infinite' }),
}

export const EmailsAddedForm = Template.bind({})
EmailsAddedForm.parameters = {
  msw: buildMswRoutes({
    overrides: {
      responseMode: FormResponseMode.Encrypt,
      status: FormStatus.Private,
      emails: ['test@example.com'],
      ...PAYMENTS_DISABLED,
    },
  }),
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  ...EmailsAddedForm,
  ...getMobileViewParameters(),
}

export const Tablet = Template.bind({})
Tablet.parameters = {
  ...EmailsAddedForm,
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}
