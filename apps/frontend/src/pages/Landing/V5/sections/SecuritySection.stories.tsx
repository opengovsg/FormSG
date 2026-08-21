import '../landing-v5.css'

import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import {
  getMobileViewParameters,
  getTabletViewParameters,
} from '~utils/storybook'

import { LandingV5Root } from '../components/LandingV5Root'

import { SecuritySection } from './SecuritySection'

export default {
  title: 'Pages/LandingV5/SecuritySection',
  component: SecuritySection,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: StoryFn = () => (
  <LandingV5Root pb="6rem">
    <SecuritySection />
  </LandingV5Root>
)

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()

/**
 * The document below the fold, so the auto-open can be watched happening rather
 * than found already finished. The peel waits for the card to be 50% in view.
 */
export const ScrolledInto: StoryFn = () => (
  <LandingV5Root pb="6rem">
    <Box h="100vh" />
    <SecuritySection />
  </LandingV5Root>
)
