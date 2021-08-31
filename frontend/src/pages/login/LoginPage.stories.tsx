import { Meta, Story } from '@storybook/react'
import StoryRouter from 'storybook-react-router'

import { authHandlers } from '~/mocks/msw/handlers/auth'

import { viewports } from '~utils/storybook'

import { LoginPage } from './LoginPage'

export default {
  title: 'Pages/LoginPage',
  component: LoginPage,
  decorators: [StoryRouter()],
  parameters: {
    layout: 'fullscreen',
    msw: authHandlers,
  },
} as Meta

const Template: Story = () => <LoginPage />
export const Desktop = Template.bind({})

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
