import { Meta, StoryFn } from '@storybook/react-vite'

import { LANDING_PAYMENTS_ROUTE } from '~constants/routes'
import { StoryRouter, viewportModes } from '~utils/storybook'

import { LandingPaymentsPage } from './LandingPaymentsPage'

export default {
  title: 'Pages/LandingPaymentsPage',
  component: LandingPaymentsPage,
  decorators: [
    StoryRouter({
      initialEntries: [LANDING_PAYMENTS_ROUTE],
      path: LANDING_PAYMENTS_ROUTE,
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
  },
} as Meta

const Template: StoryFn = () => <LandingPaymentsPage />
export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('tablet', 'mobile') } }

export const Loading = Template.bind({})
