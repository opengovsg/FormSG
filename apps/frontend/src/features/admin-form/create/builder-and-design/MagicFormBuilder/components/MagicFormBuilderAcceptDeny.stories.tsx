import { Meta, StoryFn } from '@storybook/react-vite'

import MagicFormBuilderAcceptDeny from './MagicFormBuilderAcceptDeny'

export default {
  title: 'Pages/AdminFormPage/Create/MagicFormBuilder/AcceptDeny',
  component: MagicFormBuilderAcceptDeny,
  parameters: {
    // Fixed-position overlay: nothing in the story root's flow for
    // fit-to-content to measure, so capture the viewport.
    argos: { fitToContent: false },
  },
} as Meta

const Template: StoryFn = () => (
  <MagicFormBuilderAcceptDeny isOpen onAccept={() => {}} onDeny={() => {}} />
)
export const Default = Template.bind({})
