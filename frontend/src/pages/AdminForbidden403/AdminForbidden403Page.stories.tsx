import { Meta, Story } from '@storybook/react'

import {
  getMobileViewParameters,
  LoggedInDecorator,
  StoryRouter,
} from '~utils/storybook'

import {
  AdminForbidden403Page,
  AdminForbidden403PageProps,
} from './AdminForbidden403Page'

export default {
  title: 'Pages/AdminForbidden403Page',
  component: AdminForbidden403Page,
  decorators: [
    StoryRouter({
      initialEntries: ['/admin-forbidden-403'],
      path: '/admin-forbidden-403',
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta<AdminForbidden403PageProps>

const Template: Story = (args: AdminForbidden403PageProps) => (
  <AdminForbidden403Page {...args} />
)
export const NotLoggedIn = Template.bind({})

export const WithMessage = Template.bind({})
WithMessage.args = {
  message: 'You are not authorized to access this page.',
}

export const MobileNotLoggedIn = Template.bind({})
MobileNotLoggedIn.parameters = getMobileViewParameters()

export const LoggedIn = Template.bind({})
LoggedIn.decorators = [LoggedInDecorator]

export const MobileLoggedIn = Template.bind({})
MobileLoggedIn.parameters = getMobileViewParameters()
MobileLoggedIn.decorators = [LoggedInDecorator]
