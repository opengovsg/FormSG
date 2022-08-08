import { Meta, Story } from '@storybook/react'

import { UserId } from '~shared/types'
import {
  AdminFormDto,
  FormAuthType,
  FormColorTheme,
  FormLogoState,
  FormResponseMode,
} from '~shared/types/form'

import {
  createFormBuilderMocks,
  getAdminFormSubmissions,
  MOCK_FORM_FIELDS_WITH_MYINFO,
} from '~/mocks/msw/handlers/admin-form'
import { getFreeSmsQuota } from '~/mocks/msw/handlers/admin-form/twilio'
import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  AdminFormCreatePageDecorator,
  getMobileViewParameters,
  getTabletViewParameters,
  LoggedInDecorator,
  ViewedFeatureTourDecorator,
} from '~utils/storybook'

import { CreatePage } from '~features/admin-form/create/CreatePage'

const buildMswRoutes = (
  overrides?: Partial<AdminFormDto>,
  delay?: number | 'infinite' | 'real',
) => {
  return [
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
    getFreeSmsQuota({ delay }),
  ]
}

export default {
  title: 'Pages/AdminFormPage/Create',
  // component: To be implemented,
  decorators: [
    ViewedFeatureTourDecorator,
    AdminFormCreatePageDecorator,
    LoggedInDecorator,
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    // Pass a very short delay to avoid bug where Chromatic takes a snapshot before
    // the story has loaded
    chromatic: { pauseAnimationAtEnd: true, delay: 200 },
    layout: 'fullscreen',
    msw: buildMswRoutes(),
    userId: 'adminFormTestUserId',
  },
} as Meta

const Template: Story = () => <CreatePage />
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
