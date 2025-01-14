import { Meta, StoryFn } from '@storybook/react'

import {
  BasicField,
  LongTextFieldBase,
  TextSelectedValidation,
} from '~shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditLongText, EditLongTextProps } from './EditLongText'

const DEFAULT_LONGTEXT_FIELD: LongTextFieldBase = {
  title: 'Storybook LongText',
  description: 'Some description',
  ValidationOptions: {
    customVal: null,
    selectedValidation: null,
  },
  required: true,
  disabled: false,
  fieldType: BasicField.LongText,
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditLongText',
  component: EditLongText,
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
    field: DEFAULT_LONGTEXT_FIELD,
  },
} as Meta<EditLongTextProps>

const Template: StoryFn<EditLongTextProps> = ({ field }) => {
  return <EditLongText field={field} />
}

export const Default = Template.bind({})

export const WithCustomVal = Template.bind({})
WithCustomVal.args = {
  field: {
    ...DEFAULT_LONGTEXT_FIELD,
    ValidationOptions: {
      customVal: 3,
      selectedValidation: TextSelectedValidation.Maximum,
    },
  },
}
