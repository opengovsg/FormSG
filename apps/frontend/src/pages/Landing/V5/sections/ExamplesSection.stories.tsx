import '../landing-v5.css'

import { Meta, StoryFn } from '@storybook/react'

import {
  getMobileViewParameters,
  getTabletViewParameters,
} from '~utils/storybook'

import { ExampleCard } from '../components/ExampleCard'
import { LandingV5Root } from '../components/LandingV5Root'
import { TEMPLATE_CARDS } from '../constants/templateCards'

import { ExamplesSection } from './ExamplesSection'

export default {
  title: 'Pages/LandingV5/ExamplesSection',
  component: ExamplesSection,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: StoryFn = () => (
  <LandingV5Root pb="6rem">
    <ExamplesSection />
  </LandingV5Root>
)

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()

/**
 * With a form id supplied, the card becomes a real link to
 * `/:formId/use-template` and grows its "View template" call to action. Without
 * one it is a plain figure, which is what ships until the three forms exist.
 */
export const WithTemplateLinks: StoryFn = () => (
  <LandingV5Root pb="6rem" px="2rem" pt="4rem">
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.875rem',
        alignItems: 'start',
      }}
    >
      {TEMPLATE_CARDS.map((card) => (
        <ExampleCard
          key={card.key}
          card={{ ...card, formId: '6a8411abf161e0be28977b5e' }}
        />
      ))}
    </div>
  </LandingV5Root>
)
