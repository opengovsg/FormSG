import { Meta, Story } from '@storybook/react'

import {
  getMobileViewParameters,
  LoggedInDecorator,
  StoryRouter,
} from '~utils/storybook'

import { AdminForbidden403Page } from './AdminForbidden403Page'

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
} as Meta

const Template: Story = () => <AdminForbidden403Page />
export const NotLoggedIn = Template.bind({})

export const MobileNotLoggedIn = Template.bind({})
MobileNotLoggedIn.parameters = getMobileViewParameters()

export const LoggedIn = Template.bind({})
LoggedIn.decorators = [LoggedInDecorator]

export const MobileLoggedIn = Template.bind({})
MobileLoggedIn.parameters = getMobileViewParameters()
MobileLoggedIn.decorators = [LoggedInDecorator]
