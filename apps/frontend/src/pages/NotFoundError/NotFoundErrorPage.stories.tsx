import { Meta, StoryFn } from '@storybook/react-vite'

import { getUnauthedUser } from '~/mocks/msw/handlers/user'

import {
  getMobileViewGlobals,
  LoggedInDecorator,
  LoggedOutDecorator,
  StoryRouter,
  viewportModes,
} from '~utils/storybook'

import { NotFoundErrorPage } from './NotFoundErrorPage'

export default {
  title: 'Pages/NotFoundErrorPage',
  component: NotFoundErrorPage,
  decorators: [
    StoryRouter({
      initialEntries: ['/not-found-error'],
      path: '/not-found-error',
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
  },
} as Meta

const Template: StoryFn = () => <NotFoundErrorPage />
export const NotLoggedIn = Template.bind({})
NotLoggedIn.decorators = [LoggedOutDecorator]
NotLoggedIn.parameters = {
  msw: [getUnauthedUser()],
}

export const MobileNotLoggedIn = Template.bind({})
MobileNotLoggedIn.globals = getMobileViewGlobals()
MobileNotLoggedIn.decorators = NotLoggedIn.decorators

export const LoggedIn = Template.bind({})
LoggedIn.parameters = { argos: { modes: viewportModes('mobile') } }
LoggedIn.decorators = [LoggedInDecorator]
