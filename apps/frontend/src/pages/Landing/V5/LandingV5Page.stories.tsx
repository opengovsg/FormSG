import { Meta, StoryFn } from '@storybook/react'

import { getLandingStats } from '~/mocks/msw/handlers/landing'

import { LANDING_V5_ROUTE } from '~constants/routes'
import {
  getMobileViewParameters,
  getTabletViewParameters,
  StoryRouter,
} from '~utils/storybook'

import { LandingV5Page } from './LandingV5Page'

export default {
  title: 'Pages/LandingV5/Page',
  component: LandingV5Page,
  decorators: [
    StoryRouter({
      initialEntries: [LANDING_V5_ROUTE],
      path: LANDING_V5_ROUTE,
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    msw: [
      getLandingStats({
        overrides: {
          agencyCount: 167,
          formCount: 413208,
          submissionCount: 271000000,
        },
      }),
    ],
  },
} as Meta

const Template: StoryFn = () => <LandingV5Page />
export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()
