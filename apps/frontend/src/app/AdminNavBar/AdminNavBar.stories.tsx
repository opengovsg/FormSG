import { Meta, StoryFn } from '@storybook/react-vite'

import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  getMobileViewGlobals,
  LoggedInDecorator,
  StoryRouter,
  ViewedEmergencyContactDecorator,
  viewportModes,
} from '~utils/storybook'

import { AdminNavBar, AdminNavBarProps } from './AdminNavBar'

export default {
  title: 'App/AdminNavBar',
  component: AdminNavBar,
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    msw: [getUser({ delay: 0 })],
  },
  decorators: [
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
    LoggedInDecorator,
    ViewedEmergencyContactDecorator,
  ],
} as Meta

const Template: StoryFn<AdminNavBarProps> = (args) => <AdminNavBar {...args} />

export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('tablet', 'mobile') } }

export const Expanded = Template.bind({})
Expanded.args = { isMenuOpen: true }

export const MobileExpanded = Template.bind({})
MobileExpanded.globals = getMobileViewGlobals()
MobileExpanded.parameters = {
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
