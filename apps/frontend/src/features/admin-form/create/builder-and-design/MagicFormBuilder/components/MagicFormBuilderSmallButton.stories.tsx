import { Meta, StoryFn } from '@storybook/react/*'

import MagicFormBuilderSmallButton from './MagicFormBuilderSmallButton'

export default {
  title: 'Pages/AdminFormPage/Create/MagicFormBuilder/SmallButton',
  component: MagicFormBuilderSmallButton,
} as Meta

const Template: StoryFn = ({ isActive }) => (
  <MagicFormBuilderSmallButton isActive={isActive} onClick={() => {}} />
)
export const Default = Template.bind({})
Default.args = {
  isActive: false,
}

export const Active = Template.bind({})
Active.args = {
  isActive: true,
}
