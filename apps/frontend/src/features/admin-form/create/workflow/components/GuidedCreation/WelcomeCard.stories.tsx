import { Meta, StoryFn } from '@storybook/react-vite'

import { viewportModes } from '~utils/storybook'

import { WelcomeCard } from './WelcomeCard'

export default {
  title:
    'Features/AdminForm/create/workflow/components/GuidedCreation/WelcomeCard',
  component: WelcomeCard,
  parameters: {},
} as Meta

const Template: StoryFn = () => <WelcomeCard />

export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('mobile') } }
