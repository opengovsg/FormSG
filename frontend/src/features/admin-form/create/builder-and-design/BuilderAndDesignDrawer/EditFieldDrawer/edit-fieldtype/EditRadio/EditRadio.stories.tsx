import { Meta, Story } from '@storybook/react'

import { BasicField, RadioFieldBase } from '~shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditRadio } from './EditRadio'

const DEFAULT_RADIO_FIELD: RadioFieldBase = {
  title: 'Storybook Radio',
  description: 'Some description',
  required: true,
  disabled: false,
  fieldType: BasicField.Radio,
  fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
  othersRadioButton: true,
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditRadio',
  component: EditRadio,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
    EditFieldDrawerDecorator,
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: RadioFieldBase
}

const Template: Story<StoryArgs> = ({ field }) => {
  return <EditRadio field={field} />
}

export const Default = Template.bind({})

export const WithValues = Template.bind({})
WithValues.args = {
  field: DEFAULT_RADIO_FIELD,
}

export const Placeholders = Template.bind({})
Placeholders.args = {
  field: {
    ...DEFAULT_RADIO_FIELD,
    title: '',
    description: '',
    fieldOptions: [],
  },
}
