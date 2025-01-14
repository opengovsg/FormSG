import { Meta, StoryFn } from '@storybook/react'

import {
  BasicField,
  NumberFieldBase,
  NumberSelectedLengthValidation,
  NumberSelectedValidation,
} from '~shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditNumber } from './EditNumber'

const DEFAULT_NUMBER_FIELD: NumberFieldBase = {
  title: 'Storybook Number',
  description: 'Some description',
  ValidationOptions: {
    selectedValidation: null,
    LengthValidationOptions: {
      selectedLengthValidation: null,
      customVal: null,
    },
    RangeValidationOptions: {
      customMin: null,
      customMax: null,
    },
  },
  required: true,
  disabled: false,
  fieldType: BasicField.Number,
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditNumber',
  component: EditNumber,
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
    field: DEFAULT_NUMBER_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: NumberFieldBase
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditNumber field={field} />
}

export const Default = Template.bind({})
Default.args = {
  field: DEFAULT_NUMBER_FIELD,
}

export const WithCustomVal = Template.bind({})
WithCustomVal.args = {
  field: {
    ...DEFAULT_NUMBER_FIELD,
    ValidationOptions: {
      selectedValidation: NumberSelectedValidation.Length,
      LengthValidationOptions: {
        selectedLengthValidation: NumberSelectedLengthValidation.Exact,
        customVal: 3,
      },
      RangeValidationOptions: {
        customMin: null,
        customMax: null,
      },
    },
  },
}
