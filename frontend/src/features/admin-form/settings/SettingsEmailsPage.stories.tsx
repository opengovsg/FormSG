import { Meta, Story } from '@storybook/react'

import { PaymentChannel, PaymentType } from '~shared/types'
import {
  FormResponseMode,
  FormSettings,
  FormStatus,
  WorkflowType,
} from '~shared/types/form'

import {
  getAdminFormSettings,
  getAdminFormView,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

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
  mode,
  delay,
}: {
  overrides?: Partial<FormSettings>
  mode?: FormResponseMode
  delay?: number | 'infinite'
} = {}) => [
  getAdminFormView({ overrides, mode, delay }),
  getAdminFormSettings({ overrides, mode, delay }),
  patchAdminFormSettings({ overrides, mode, delay }),
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
    mode: FormResponseMode.Encrypt,
    overrides: {
      status: FormStatus.Private,
      emails: [], // has one email by default
      ...PAYMENTS_DISABLED,
    },
  }),
}

export const PrivateEmailForm = Template.bind({})
PrivateEmailForm.parameters = {
  msw: buildMswRoutes({
    mode: FormResponseMode.Email,
    overrides: {
      status: FormStatus.Private,
    },
  }),
}

export const PrivateMultiRespondentForm = Template.bind({})
PrivateMultiRespondentForm.parameters = {
  msw: buildMswRoutes({
    mode: FormResponseMode.Multirespondent,
    overrides: {
      status: FormStatus.Private,
      emails: [],
      stepsToNotify: [],
      workflow: [
        {
          _id: 'field_id_1',
          workflow_type: WorkflowType.Dynamic,
          field: 'email_field_id',
          edit: [],
        },
        {
          _id: 'field_id_2',
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
      ],
    },
  }),
}

export const PublicForm = Template.bind({})
PublicForm.parameters = {
  msw: buildMswRoutes({
    mode: FormResponseMode.Encrypt,
    overrides: {
      status: FormStatus.Public,
      emails: [],
      ...PAYMENTS_DISABLED,
    },
  }),
}

export const PublicMultiRespondentForm = Template.bind({})
PublicMultiRespondentForm.parameters = {
  msw: buildMswRoutes({
    mode: FormResponseMode.Multirespondent,
    overrides: {
      status: FormStatus.Public,
      emails: ['expected1@example.com', 'expected2@example.com'],
      stepsToNotify: ['field_1_id'],
      workflow: [
        {
          _id: 'field_1_id',
          workflow_type: WorkflowType.Dynamic,
          field: 'email_field_id',
          edit: [],
        },
        {
          _id: 'field_2_id',
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [],
        },
      ],
      ...PAYMENTS_DISABLED,
    },
  }),
}

export const PaymentForm = Template.bind({})
PaymentForm.parameters = {
  msw: buildMswRoutes({
    mode: FormResponseMode.Encrypt,
    overrides: {
      status: FormStatus.Private,
      emails: [],
      ...PAYMENTS_ENABLED,
    },
  }),
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: buildMswRoutes({ delay: 'infinite' }),
}

export const NoEmailsAddedForm = Template.bind({})
NoEmailsAddedForm.parameters = {
  msw: buildMswRoutes({
    mode: FormResponseMode.Encrypt,
    overrides: {
      status: FormStatus.Private,
      emails: [],
      ...PAYMENTS_DISABLED,
    },
  }),
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  ...NoEmailsAddedForm,
  ...getMobileViewParameters(),
}

export const Tablet = Template.bind({})
Tablet.parameters = {
  ...NoEmailsAddedForm,
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}
