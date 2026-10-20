import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { featureFlags } from 'formsg-shared/constants'

import { viewportModes } from '~utils/storybook'

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
  parameters: {},
} as Meta

const Template: StoryFn = () => <WelcomeCard />

export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('mobile') } }
