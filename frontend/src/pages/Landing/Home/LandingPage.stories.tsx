import { Meta, StoryFn } from '@storybook/react'

import { getLandingStats } from '~/mocks/msw/handlers/landing'

import { LANDING_ROUTE } from '~constants/routes'
import {
  getMobileViewParameters,
  getTabletViewParameters,
  StoryRouter,
} from '~utils/storybook'

import { LandingPage } from './LandingPage'

export default {
  title: 'Pages/LandingPage',
  component: LandingPage,
  decorators: [
    StoryRouter({
      initialEntries: [LANDING_ROUTE],
      path: LANDING_ROUTE,
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    msw: [getLandingStats()],
  },
} as Meta

const Template: StoryFn = () => <LandingPage />
export const Default = Template.bind({})

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [getLandingStats({ delay: 'infinite' })],
}

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()
