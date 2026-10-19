import { Meta, StoryFn } from '@storybook/react-vite'

import { authHandlers, otpGenerationResponse } from '~/mocks/msw/handlers/auth'

import { LOGIN_ROUTE } from '~constants/routes'
import { StoryRouter } from '~utils/storybook'

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
  },
} as Meta

const Template: StoryFn = () => <LoginPage />
export const Desktop = Template.bind({})

export const Tablet = Template.bind({})
Tablet.globals = { viewport: { value: 'tablet', isRotated: false } }

export const Mobile = Template.bind({})
Mobile.globals = { viewport: { value: 'mobile1', isRotated: false } }

export const InvalidAgencyResponse = Template.bind({})
InvalidAgencyResponse.parameters = {
  msw: [otpGenerationResponse({ isInvalid: true }), ...authHandlers.slice(1)],
}
