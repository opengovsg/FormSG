import { Meta, Story } from '@storybook/react'

import {
  getMobileViewParameters,
  LoggedInDecorator,
  StoryRouter,
} from '~utils/storybook'

import { NotFound404Page } from './NotFound404Page'

export default {
  title: 'Pages/NotFound404Page',
  component: NotFound404Page,
  decorators: [
    StoryRouter({
      initialEntries: ['/not-found-404'],
      path: '/not-found-404',
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: Story = () => <NotFound404Page />
export const NotLoggedIn = Template.bind({})

export const MobileNotLoggedIn = Template.bind({})
MobileNotLoggedIn.parameters = getMobileViewParameters()

export const LoggedIn = Template.bind({})
LoggedIn.decorators = [LoggedInDecorator]

export const MobileLoggedIn = Template.bind({})
MobileLoggedIn.parameters = getMobileViewParameters()
MobileLoggedIn.decorators = [LoggedInDecorator]
