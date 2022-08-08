import { Meta, Story } from '@storybook/react'

import {
  getMobileViewParameters,
  LoggedInDecorator,
  LoggedOutDecorator,
  StoryRouter,
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
  },
} as Meta

const Template: Story = () => <NotFoundErrorPage />
export const NotLoggedIn = Template.bind({})
NotLoggedIn.decorators = [LoggedOutDecorator]

export const MobileNotLoggedIn = Template.bind({})
MobileNotLoggedIn.parameters = getMobileViewParameters()
MobileNotLoggedIn.decorators = NotLoggedIn.decorators

export const LoggedIn = Template.bind({})
LoggedIn.decorators = [LoggedInDecorator]

export const MobileLoggedIn = Template.bind({})
MobileLoggedIn.parameters = getMobileViewParameters()
MobileLoggedIn.decorators = LoggedIn.decorators
