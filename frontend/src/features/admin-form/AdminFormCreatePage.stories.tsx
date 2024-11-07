import { Meta, StoryFn } from '@storybook/react'

import { PaymentChannel, PaymentType, UserId } from '~shared/types'
import {
  AdminFormDto,
  FormAuthType,
  FormColorTheme,
  FormLogoState,
  FormResponseMode,
} from '~shared/types/form'

import {
  createFormBuilderMocks,
  getAdminFormCollaborators,
  getAdminFormSettings,
  getAdminFormSubmissions,
  MOCK_FORM_FIELDS_WITH_MYINFO,
  MOCK_FORM_LOGICS,
} from '~/mocks/msw/handlers/admin-form'
import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  AdminFormCreatePageDecorator,
  getMobileViewParameters,
  getTabletViewParameters,
  LoggedInDecorator,
  mockDateDecorator,
  ViewedFeatureTourDecorator,
} from '~utils/storybook'

import { CreatePage } from '~features/admin-form/create/CreatePage'

const buildMswRoutes = (
  overrides?: Partial<AdminFormDto>,
  delay?: number | 'infinite' | 'real',
) => {
  return [
    getAdminFormSettings(),
    getAdminFormCollaborators(),
    getAdminFormSubmissions(),
    ...createFormBuilderMocks(
      {
        ...overrides,
        startPage: {
          logo: { state: FormLogoState.Default },
          colorTheme: FormColorTheme.Blue,
          paragraph: 'Fill in this mock form in this story.',
          estTimeTaken: 300,
        },
      },
      delay,
    ),
    getAdminFormSubmissions(),
    getUser({
      delay: 0,
      mockUser: { ...MOCK_USER, _id: 'adminFormTestUserId' as UserId },
    }),
  ]
}

export default {
  title: 'Pages/AdminFormPage/Create',
  // component: To be implemented,
  decorators: [
    ViewedFeatureTourDecorator,
    AdminFormCreatePageDecorator,
    LoggedInDecorator,
    mockDateDecorator,
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    // Pass a very short delay to avoid bug where Chromatic takes a snapshot before
    // the story has loaded
    chromatic: { pauseAnimationAtEnd: true, delay: 200 },
    layout: 'fullscreen',
    msw: buildMswRoutes(),
    mockdate: new Date('2022-12-25T06:22:27.219Z'),
    userId: 'adminFormTestUserId',
  },
} as Meta

const Template: StoryFn = () => <CreatePage />
export const DesktopEmpty = Template.bind({})
export const DesktopAllFields = Template.bind({})
DesktopAllFields.parameters = {
  msw: buildMswRoutes({
    form_fields: MOCK_FORM_FIELDS_WITH_MYINFO,
    authType: FormAuthType.MyInfo,
    responseMode: FormResponseMode.Email,
  }),
}

export const DesktopLoading = Template.bind({})
DesktopLoading.parameters = {
  msw: buildMswRoutes({}, 'infinite'),
}

export const TabletEmpty = Template.bind({})
TabletEmpty.parameters = getTabletViewParameters()
export const TabletAllFields = Template.bind({})
TabletAllFields.parameters = {
  ...getTabletViewParameters(),
  msw: buildMswRoutes({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
}
export const TabletLoading = Template.bind({})
TabletLoading.parameters = {
  ...getTabletViewParameters(),
  mockdate: new Date('2024-09-11T13:00:00.000Z'),
  msw: buildMswRoutes({}, 'infinite'),
}

export const MobileEmpty = Template.bind({})
MobileEmpty.parameters = getMobileViewParameters()
export const MobileAllFields = Template.bind({})
MobileAllFields.parameters = {
  ...getMobileViewParameters(),
  msw: buildMswRoutes({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
}
export const MobileLoading = Template.bind({})
MobileLoading.parameters = {
  ...getMobileViewParameters(),
  msw: buildMswRoutes({}, 'infinite'),
}

export const AllFieldsFieldsHiddenByLogic = Template.bind({})
AllFieldsFieldsHiddenByLogic.parameters = {
  msw: buildMswRoutes({
    form_fields: MOCK_FORM_FIELDS_WITH_MYINFO,
    form_logics: MOCK_FORM_LOGICS,
    authType: FormAuthType.MyInfo,
    responseMode: FormResponseMode.Email,
  }),
}

export const FormWithWebhook = Template.bind({})
FormWithWebhook.parameters = {
  msw: [
    getAdminFormSettings({
      overrides: {
        webhook: {
          url: 'some-webhook-url',
          isRetryEnabled: false,
        },
      },
    }),
    ...buildMswRoutes(),
  ],
}

export const FormWithWebhookMobile = Template.bind({})
FormWithWebhookMobile.parameters = {
  ...FormWithWebhook.parameters,
  ...getMobileViewParameters(),
}

export const FormWithPayment = Template.bind({})
FormWithPayment.parameters = {
  msw: buildMswRoutes({
    responseMode: FormResponseMode.Encrypt,
    payments_channel: {
      channel: PaymentChannel.Stripe,
      target_account_id: 'acct_sampleid',
      publishable_key: 'pk_samplekey',
    },
    payments_field: {
      enabled: true,
      description: 'Test event registration fee',
      payment_type: PaymentType.Variable,
      min_amount: 1000,
      max_amount: 5000,
    },
  }),
}

export const FormWithPaymentMobile = Template.bind({})
FormWithPaymentMobile.parameters = {
  ...FormWithPayment.parameters,
  ...getMobileViewParameters(),
}
