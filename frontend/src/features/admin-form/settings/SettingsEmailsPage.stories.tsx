import { Meta, Story } from '@storybook/react'

import { PaymentChannel, PaymentType } from '~shared/types'
import { FormResponseMode, FormSettings, FormStatus } from '~shared/types/form'

import {
  getAdminFormSettings,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import {
  getMobileViewParameters,
  StoryRouter,
  viewports,
} from '~utils/storybook'

import { SettingsEmailsPage } from './SettingsEmailsPage'

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
    },
  }),
}

export const PrivateEmailForm = Template.bind({})
PrivateEmailForm.parameters = {
  msw: buildMswRoutes({
    overrides: {
      responseMode: FormResponseMode.Email,
      status: FormStatus.Private,
    },
  }),
}

export const PublicForm = Template.bind({})
PublicForm.parameters = {
  msw: buildMswRoutes({
    overrides: {
      status: FormStatus.Public,
    },
  }),
}

export const PaymentForm = Template.bind({})
PaymentForm.parameters = {
  msw: buildMswRoutes({
    overrides: {
      responseMode: FormResponseMode.Encrypt,
      status: FormStatus.Public,
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
    },
  }),
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: buildMswRoutes({ delay: 'infinite' }),
}

export const EmailsAddedForm = Template.bind({})
PrivateStorageForm.parameters = {
  msw: buildMswRoutes({
    overrides: {
      responseMode: FormResponseMode.Encrypt,
      status: FormStatus.Private,
      emails: ['test@example.com'],
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
