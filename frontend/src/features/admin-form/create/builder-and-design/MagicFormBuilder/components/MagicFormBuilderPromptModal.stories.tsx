import { Meta, StoryFn } from '@storybook/react/*'

import MagicFormBuilderPromptModal from './MagicFormBuilderPromptModal'

export default {
  title: 'Pages/AdminFormPage/Create/MagicFormBuilder/PromptModal',
  component: MagicFormBuilderPromptModal,
  argTypes: {
    isSubmitLoading: {
      control: {
        type: 'boolean',
      },
      isOpen: {
        type: 'boolean',
        defaultValue: true,
      },
    },
  },
} as Meta

const Template: StoryFn = (args) => {
  const { isOpen, isSubmitLoading } = args

  return (
    <MagicFormBuilderPromptModal
      isOpen={isOpen}
      onTextPromptSubmit={() => {}}
      isTextPromptSubmitLoading={isSubmitLoading}
      onVisionPromptSubmit={() => {}}
      isVisionPromptSubmitLoading={isSubmitLoading}
      onClose={() => {}}
    />
  )
}

export const Default = Template.bind({})
Default.args = {
  isOpen: true,
  isSubmitLoading: false,
}

export const Loading = Template.bind({})
Loading.args = {
  isOpen: true,
  isSubmitLoading: true,
}
