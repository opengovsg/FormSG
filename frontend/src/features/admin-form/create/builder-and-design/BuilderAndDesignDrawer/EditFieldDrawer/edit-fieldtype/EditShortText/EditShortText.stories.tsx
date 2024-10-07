import { Meta, StoryFn } from '@storybook/react'

import {
  BasicField,
  ShortTextFieldBase,
  TextSelectedValidation,
} from '~shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditShortText, EditShortTextProps } from './EditShortText'

const DEFAULT_SHORTTEXT_FIELD: ShortTextFieldBase = {
  title: 'Storybook ShortText',
  description: 'Some description',
  ValidationOptions: {
    customVal: null,
    selectedValidation: null,
  },
  required: true,
  disabled: false,
  fieldType: BasicField.ShortText,
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditShortText',
  component: EditShortText,
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
    field: DEFAULT_SHORTTEXT_FIELD,
  },
} as Meta<EditShortTextProps>

const Template: StoryFn<EditShortTextProps> = ({ field }) => {
  return <EditShortText field={field} />
}

export const Default = Template.bind({})

export const WithCustomVal = Template.bind({})
WithCustomVal.args = {
  field: {
    ...DEFAULT_SHORTTEXT_FIELD,
    ValidationOptions: {
      customVal: 3,
      selectedValidation: TextSelectedValidation.Maximum,
    },
  },
}

export const PrefillNoFieldId = Template.bind({})
PrefillNoFieldId.args = {
  field: {
    ...DEFAULT_SHORTTEXT_FIELD,
    allowPrefill: true,
  },
}

export const PrefillWithFieldId = Template.bind({})
PrefillWithFieldId.args = {
  field: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ...PrefillNoFieldId.args.field!,
    _id: 'mock-field-id-allow-copy',
  },
}
