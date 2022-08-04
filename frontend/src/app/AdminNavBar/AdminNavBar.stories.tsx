import { Meta, Story } from '@storybook/react'

import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  getMobileViewParameters,
  getTabletViewParameters,
  LoggedInDecorator,
  StoryRouter,
  ViewedEmergencyContactDecorator,
} from '~utils/storybook'

import { AdminNavBar, AdminNavBarProps } from './AdminNavBar'

export default {
  title: 'App/AdminNavBar',
  component: AdminNavBar,
  parameters: {
    layout: 'fullscreen',
    msw: [getUser({ delay: 0 })],
  },
  decorators: [
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
    LoggedInDecorator,
    ViewedEmergencyContactDecorator,
  ],
} as Meta

const Template: Story<AdminNavBarProps> = (args) => <AdminNavBar {...args} />

export const Default = Template.bind({})

export const Expanded = Template.bind({})
Expanded.args = { isMenuOpen: true }

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const MobileExpanded = Template.bind({})
MobileExpanded.parameters = {
  ...Mobile.parameters,
  msw: [
    getUser({
      delay: 0,
      mockUser: {
        ...MOCK_USER,
        email: 'super_super_super_super_super_long_name@example.com',
      },
    }),
  ],
}
MobileExpanded.args = Expanded.args

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()
