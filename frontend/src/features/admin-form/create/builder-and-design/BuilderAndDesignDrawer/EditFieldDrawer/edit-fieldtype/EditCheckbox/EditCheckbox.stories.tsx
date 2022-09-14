import { Meta, Story } from '@storybook/react'

import { BasicField, CheckboxFieldBase } from '~shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditCheckbox } from './EditCheckbox'

const DEFAULT_CHECKBOX_FIELD: CheckboxFieldBase = {
  title: 'Storybook Checkbox',
  description: 'Some description',
  required: true,
  disabled: false,
  fieldType: BasicField.Checkbox,
  fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
  ValidationOptions: {
    customMax: 3,
    customMin: 2,
  },
  validateByValue: true,
  othersRadioButton: true,
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditCheckbox',
  component: EditCheckbox,
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
  field: CheckboxFieldBase
}

const Template: Story<StoryArgs> = ({ field }) => {
  return <EditCheckbox field={field} />
}

export const Default = Template.bind({})

export const WithValues = Template.bind({})
WithValues.args = {
  field: DEFAULT_CHECKBOX_FIELD,
}

export const Placeholders = Template.bind({})
Placeholders.args = {
  field: {
    ...DEFAULT_CHECKBOX_FIELD,
    title: '',
    description: '',
    fieldOptions: [],
    validateByValue: false,
  },
}
