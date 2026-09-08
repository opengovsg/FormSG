import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'

import { viewports } from '~utils/storybook'

import { WelcomeCard } from './WelcomeCard'

const redesignOn = new GrowthBook({
  features: { [featureFlags.workflowBuilderRedesign]: { defaultValue: true } },
})

export default {
  title:
    'Features/AdminForm/create/workflow/components/GuidedCreation/WelcomeCard',
  component: WelcomeCard,
  decorators: [
    (Story: StoryFn) => (
      <GrowthBookProvider growthbook={redesignOn}>
        <Story />
      </GrowthBookProvider>
    ),
  ],
  parameters: {
    chromatic: { pauseAnimationAtEnd: true, delay: 1200 },
  },
} as Meta

const Template: StoryFn = () => <WelcomeCard />

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: { defaultViewport: 'mobile1' },
  chromatic: {
    viewports: [viewports.xs],
    pauseAnimationAtEnd: true,
    delay: 1200,
  },
}
