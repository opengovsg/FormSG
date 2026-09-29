import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'

import { getLandingStats } from '~/mocks/msw/handlers/landing'

import { LANDING_ROUTE } from '~constants/routes'
import {
  getMobileViewParameters,
  getTabletViewParameters,
  StoryRouter,
} from '~utils/storybook'

import { LandingV5Page } from './LandingV5Page'

// V5 only ever renders with the brand-refresh flag on; without this,
// Storybook's missing GrowthBook provider would default the flag to false
// and show the old logo, a state production never shows for this page.
const brandRefreshOn = new GrowthBook({
  features: { [featureFlags.brandRefresh]: { defaultValue: true } },
})

export default {
  title: 'Pages/LandingV5/Page',
  component: LandingV5Page,
  decorators: [
    StoryRouter({
      initialEntries: [LANDING_ROUTE],
      path: LANDING_ROUTE,
    }),
    (Story) => (
      <GrowthBookProvider growthbook={brandRefreshOn}>
        <Story />
      </GrowthBookProvider>
    ),
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
