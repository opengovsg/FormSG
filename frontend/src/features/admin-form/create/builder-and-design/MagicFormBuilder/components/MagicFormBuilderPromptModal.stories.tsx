import { Meta, StoryFn } from '@storybook/react/*'
import { userEvent, within } from '@storybook/test'

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
