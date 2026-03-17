import { Meta, StoryFn } from '@storybook/react'

import { LANDING_PAYMENTS_ROUTE } from '~constants/routes'
import {
  getMobileViewParameters,
  getTabletViewParameters,
  StoryRouter,
} from '~utils/storybook'

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
  },
} as Meta

const Template: StoryFn = () => <LandingPaymentsPage />
export const Default = Template.bind({})

export const Loading = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()
