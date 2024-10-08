import { Meta, StoryFn } from '@storybook/react'

import { authHandlers, otpGenerationResponse } from '~/mocks/msw/handlers/auth'

import { LOGIN_ROUTE } from '~constants/routes'
import { StoryRouter, viewports } from '~utils/storybook'

import { LoginPage } from './LoginPage'

export default {
  title: 'Pages/LoginPage',
  component: LoginPage,
  decorators: [
    StoryRouter({
      initialEntries: [LOGIN_ROUTE],
      path: LOGIN_ROUTE,
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    msw: authHandlers,
    chromatic: { delay: 200 },
  },
} as Meta

const Template: StoryFn = () => <LoginPage />
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

export const InvalidAgencyResponse = Template.bind({})
InvalidAgencyResponse.parameters = {
  msw: [otpGenerationResponse({ isInvalid: true }), ...authHandlers.slice(1)],
}
