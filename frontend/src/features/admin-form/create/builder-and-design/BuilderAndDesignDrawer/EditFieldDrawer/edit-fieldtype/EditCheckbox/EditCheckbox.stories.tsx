import { Meta, Story } from '@storybook/react'

import { BasicField, CheckboxFieldBase } from '~shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'

import { EditCheckbox } from './EditCheckbox'

const DEFAULT_CHECKBOX_FIELD = getFieldCreationMeta(
  BasicField.Checkbox,
) as CheckboxFieldBase

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
  args: {
    field: DEFAULT_CHECKBOX_FIELD,
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
  field: {
    ...DEFAULT_CHECKBOX_FIELD,
    title: 'Storybook Checkbox',
    description: 'Some description',
    fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
    ValidationOptions: {
      customMax: 3,
      customMin: 2,
    },
    validateByValue: true,
    othersRadioButton: true,
  },
}

export const Placeholders = Template.bind({})
Placeholders.args = {
  field: {
    ...DEFAULT_CHECKBOX_FIELD,
    title: '',
    description: '',
    fieldOptions: [],
    required: false,
  },
}
