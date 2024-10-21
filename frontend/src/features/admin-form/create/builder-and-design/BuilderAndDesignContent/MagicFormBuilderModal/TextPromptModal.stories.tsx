import { Meta, StoryFn } from '@storybook/react'

import { StoryRouter } from '~utils/storybook'

import { TextPromptModal } from './TextPromptModal'

export default {
  title: 'Features/AdminForm/TextPromptModal',
  component: TextPromptModal,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
  ],
} as Meta

const Template: StoryFn = () => {
  return <TextPromptModal isOpen={true} onClose={() => {}} />
}

export const OpenModal = Template.bind({})
