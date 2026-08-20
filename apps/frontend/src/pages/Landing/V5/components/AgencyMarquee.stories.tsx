import '../landing-v5.css'

import { Meta, StoryFn } from '@storybook/react'

import {
  getMobileViewParameters,
  getTabletViewParameters,
} from '~utils/storybook'

import { AGENCY_LOGOS } from '../constants/agencyLogos'

import { AgencyMarquee } from './AgencyMarquee'
import { LandingV5Root } from './LandingV5Root'

export default {
  title: 'Pages/LandingV5/AgencyMarquee',
  component: AgencyMarquee,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: StoryFn = () => (
  <LandingV5Root py="3rem">
    <AgencyMarquee />
  </LandingV5Root>
)

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()

/**
 * What happens when an agency's `logo` field changes in Mongo and the
 * hardcoded key stops resolving: the logo leaves the row rather than sitting
 * there as a broken-image box. Two keys here are deliberately wrong.
 */
export const WithBrokenLogos: StoryFn = () => (
  <LandingV5Root py="3rem">
    <AgencyMarquee
      logos={[
        ...AGENCY_LOGOS.slice(0, 4),
        { key: 'does-not-exist.png', name: 'Missing Agency' },
        ...AGENCY_LOGOS.slice(4, 8),
        { key: 'moe.jpg', name: 'Wrong Extension Agency' },
      ]}
    />
  </LandingV5Root>
)
