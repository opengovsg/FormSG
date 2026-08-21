import '../landing-v5.css'

import { Meta, StoryFn } from '@storybook/react'

import {
  getMobileViewParameters,
  getTabletViewParameters,
} from '~utils/storybook'

import { LandingV5Root } from '../components/LandingV5Root'

import { HeroSection } from './HeroSection'

export default {
  title: 'Pages/LandingV5/HeroSection',
  component: HeroSection,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

/**
 * The embed is left off in Storybook. The form is an OGP production form, so the
 * relative path resolves to Storybook's own 404 here — showing that would be
 * more misleading than showing the placeholder the pane uses before loading.
 */
const Template: StoryFn = () => (
  <LandingV5Root pb="6rem">
    <HeroSection embeddedFormId={undefined} />
  </LandingV5Root>
)

export const Default = Template.bind({})

/**
 * With the embed armed, as it behaves on production. In Storybook this shows a
 * 404 inside the pane — that is the environment, not the component.
 */
export const WithLiveEmbed: StoryFn = () => (
  <LandingV5Root pb="6rem">
    <HeroSection />
  </LandingV5Root>
)

/**
 * Below the two-column breakpoint the panes go near-full-width and the builder
 * swaps to its portrait capture, with the caption swapping to match.
 */
export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()
