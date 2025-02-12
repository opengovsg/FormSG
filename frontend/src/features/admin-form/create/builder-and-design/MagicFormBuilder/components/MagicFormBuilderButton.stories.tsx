import { Meta, StoryFn } from '@storybook/react/*'

import MagicFormBuilderButton from './MagicFormBuilderButton'

export default {
  title: 'Pages/AdminFormPage/Create/MagicFormBuilder/Button',
  component: MagicFormBuilderButton,
} as Meta

const Template: StoryFn = () => <MagicFormBuilderButton onClick={() => {}} />
export const Default = Template.bind({})
