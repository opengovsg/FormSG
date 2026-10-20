import { Meta, StoryFn } from '@storybook/react-vite'

import { authHandlers, otpGenerationResponse } from '~/mocks/msw/handlers/auth'

import { LOGIN_ROUTE } from '~constants/routes'
import { StoryRouter, viewportModes } from '~utils/storybook'

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
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    msw: authHandlers,
  },
} as Meta

const Template: StoryFn = () => <LoginPage />
export const Desktop = Template.bind({})
Desktop.parameters = { argos: { modes: viewportModes('tablet', 'mobile') } }

export const InvalidAgencyResponse = Template.bind({})
InvalidAgencyResponse.parameters = {
  msw: [otpGenerationResponse({ isInvalid: true }), ...authHandlers.slice(1)],
}
