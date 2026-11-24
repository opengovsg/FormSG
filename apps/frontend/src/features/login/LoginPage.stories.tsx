import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Decorator, Meta, StoryFn } from '@storybook/react-vite'

import { featureFlags } from 'formsg-shared/constants'

import { authHandlers, otpGenerationResponse } from '~/mocks/msw/handlers/auth'

import { LOGIN_ROUTE } from '~constants/routes'
import { StoryRouter, viewportModes } from '~utils/storybook'

import { LoginPage } from './LoginPage'

const withGrowthBook =
  (growthbook: GrowthBook): Decorator =>
  (Story) => (
    <GrowthBookProvider growthbook={growthbook}>
      <Story />
    </GrowthBookProvider>
  )

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
    msw: { handlers: { default: authHandlers } },
  },
} as Meta

const Template: StoryFn = () => <LoginPage />
export const Desktop = Template.bind({})
Desktop.parameters = { argos: { modes: viewportModes('tablet', 'mobile') } }

export const InvalidAgencyResponse = Template.bind({})
InvalidAgencyResponse.parameters = {
  msw: {
    handlers: {
      default: [
        otpGenerationResponse({ isInvalid: true }),
        ...authHandlers.slice(1),
      ],
    },
  },
}

export const WithOneGovSg = Template.bind({})
WithOneGovSg.parameters = Desktop.parameters
WithOneGovSg.decorators = [
  withGrowthBook(
    new GrowthBook({
      features: { [featureFlags.ogpSuiteSso]: { defaultValue: true } },
    }),
  ),
]
