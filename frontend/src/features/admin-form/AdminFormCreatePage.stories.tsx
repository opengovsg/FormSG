import { Meta, Story } from '@storybook/react'

import { UserId } from '~shared/types'
import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
} from '~shared/types/form'

import {
  createFormBuilderMocks,
  MOCK_FORM_FIELDS_WITH_MYINFO,
} from '~/mocks/msw/handlers/admin-form'
import { getFreeSmsQuota } from '~/mocks/msw/handlers/admin-form/twilio'
import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  AdminFormCreatePageDecorator,
  LoggedInDecorator,
  ViewedFeatureTourDecorator,
  viewports,
} from '~utils/storybook'

import { CreatePage } from '~features/admin-form/create/CreatePage'

const buildMswRoutes = (
  overrides?: Partial<AdminFormDto>,
  delay?: number | 'infinite' | 'real',
) => {
  return [
    ...createFormBuilderMocks(overrides, delay),
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

export const TabletEmpty = Template.bind({})
TabletEmpty.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}
export const TabletAllFields = Template.bind({})
TabletAllFields.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: buildMswRoutes({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
}

export const MobileEmpty = Template.bind({})
MobileEmpty.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
export const MobileAllFields = Template.bind({})
MobileAllFields.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: buildMswRoutes({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
}
