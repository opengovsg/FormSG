import { Meta, Story } from '@storybook/react'

import { getLandingStats } from '~/mocks/msw/handlers/landing'

import { LANDING_PAYMENTS_ROUTE } from '~constants/routes'
import {
  getMobileViewParameters,
  getTabletViewParameters,
  StoryRouter,
} from '~utils/storybook'

import { LandingPaymentsPage } from './LandingPaymentsPage'

export default {
  title: 'Pages/LandingPage',
  component: LandingPaymentsPage,
  decorators: [
    StoryRouter({
      initialEntries: [LANDING_PAYMENTS_ROUTE],
      path: LANDING_PAYMENTS_ROUTE,
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    msw: [getLandingStats()],
  },
} as Meta

const Template: Story = () => <LandingPaymentsPage />
export const Default = Template.bind({})

export const Loading = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()
