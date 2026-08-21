import '../landing-v5.css'

import { Meta, StoryFn } from '@storybook/react'

import {
  getMobileViewParameters,
  getTabletViewParameters,
} from '~utils/storybook'

import { LandingV5Root } from '../components/LandingV5Root'

import { TestimonialSection } from './TestimonialSection'

export default {
  title: 'Pages/LandingV5/TestimonialSection',
  component: TestimonialSection,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: StoryFn = () => (
  <LandingV5Root pb="6rem">
    <TestimonialSection />
  </LandingV5Root>
)

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()
