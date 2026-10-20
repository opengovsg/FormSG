import { Meta, StoryFn } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'

import MagicFormBuilderPromptModal from './MagicFormBuilderPromptModal'

export default {
  title: 'Pages/AdminFormPage/Create/MagicFormBuilder/PromptModal',
  component: MagicFormBuilderPromptModal,
  parameters: {
    // The modal renders in a portal, so there is nothing in the story root for
    // fit-to-content to measure; capture the viewport.
    argos: { fitToContent: false },
  },
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

export const Text = Template.bind({})
Text.args = {
  isOpen: true,
  isSubmitLoading: false,
}

export const Pdf = Template.bind({})
Pdf.args = {
  isOpen: true,
  isSubmitLoading: false,
}
Pdf.play = async () => {
  const canvas = within(document.body)
  const pdfTab = await canvas.findByRole('tab', { name: /pdf/i })
  await userEvent.click(pdfTab)
}

export const Loading = Template.bind({})
Loading.args = {
  isOpen: true,
  isSubmitLoading: true,
}
