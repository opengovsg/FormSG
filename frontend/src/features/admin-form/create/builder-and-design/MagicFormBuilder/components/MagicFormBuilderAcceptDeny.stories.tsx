import { Meta, StoryFn } from '@storybook/react/*'

import MagicFormBuilderAcceptDeny from './MagicFormBuilderAcceptDeny'

export default {
  title: 'Pages/AdminFormPage/Create/MagicFormBuilder/AcceptDeny',
  component: MagicFormBuilderAcceptDeny,
} as Meta

const Template: StoryFn = () => (
  <MagicFormBuilderAcceptDeny isOpen onAccept={() => {}} onDeny={() => {}} />
)
export const Default = Template.bind({})
