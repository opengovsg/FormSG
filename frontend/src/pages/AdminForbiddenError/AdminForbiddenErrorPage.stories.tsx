import { Meta, Story } from '@storybook/react'

import { getUnauthedUser } from '~/mocks/msw/handlers/user'

import {
  getMobileViewParameters,
  LoggedInDecorator,
  LoggedOutDecorator,
  StoryRouter,
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
  },
} as Meta<AdminForbiddenErrorPageProps>

const Template: Story = (args: AdminForbiddenErrorPageProps) => (
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
MobileNotLoggedIn.parameters = getMobileViewParameters()
MobileNotLoggedIn.decorators = NotLoggedIn.decorators

export const LoggedIn = Template.bind({})
LoggedIn.decorators = [LoggedInDecorator]

export const MobileLoggedIn = Template.bind({})
MobileLoggedIn.parameters = getMobileViewParameters()
MobileLoggedIn.decorators = LoggedIn.decorators
