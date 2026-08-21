import '../landing-v5.css'

import { Meta, StoryFn } from '@storybook/react'

import {
  getMobileViewParameters,
  getTabletViewParameters,
} from '~utils/storybook'

import { LandingV5Root } from '../components/LandingV5Root'

import { CapabilitiesSection } from './CapabilitiesSection'

export default {
  title: 'Pages/LandingV5/CapabilitiesSection',
  component: CapabilitiesSection,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: StoryFn = () => (
  <LandingV5Root pb="6rem">
    <CapabilitiesSection />
  </LandingV5Root>
)

export const Default = Template.bind({})

/** The edit pane is dropped below xl; the canvas carries the row on its own. */
export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()
