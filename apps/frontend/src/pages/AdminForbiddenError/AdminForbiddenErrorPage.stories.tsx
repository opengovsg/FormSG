import { Meta, StoryFn } from '@storybook/react-vite'

import { getUnauthedUser } from '~/mocks/msw/handlers/user'

import {
  getMobileViewGlobals,
  LoggedInDecorator,
  LoggedOutDecorator,
  StoryRouter,
  viewportModes,
} from '~utils/storybook'

import {
  AdminForbiddenErrorPage,
  AdminForbiddenErrorPageProps,
} from './AdminForbiddenErrorPage'

export default {
  title: 'Pages/AdminForbiddenErrorPage',
  component: AdminForbiddenErrorPage,
  decorators: [
    StoryRouter({
      initialEntries: ['/admin-forbidden-error'],
      path: '/admin-forbidden-error',
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
  },
} as Meta<AdminForbiddenErrorPageProps>

const Template: StoryFn = (args: AdminForbiddenErrorPageProps) => (
  <AdminForbiddenErrorPage {...args} />
)
export const NotLoggedIn = Template.bind({})
NotLoggedIn.decorators = [LoggedOutDecorator]
NotLoggedIn.parameters = {
  msw: [getUnauthedUser()],
}

export const WithMessage = Template.bind({})
WithMessage.args = {
  message: 'You are not authorized to access this page.',
}
WithMessage.decorators = [LoggedInDecorator]

export const MobileNotLoggedIn = Template.bind({})
MobileNotLoggedIn.globals = getMobileViewGlobals()
MobileNotLoggedIn.decorators = NotLoggedIn.decorators

export const LoggedIn = Template.bind({})
LoggedIn.parameters = { argos: { modes: viewportModes('mobile') } }
LoggedIn.decorators = [LoggedInDecorator]
