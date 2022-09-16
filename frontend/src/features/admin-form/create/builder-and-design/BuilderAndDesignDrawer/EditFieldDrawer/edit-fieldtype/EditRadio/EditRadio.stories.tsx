import { Meta, Story } from '@storybook/react'

import { BasicField, RadioFieldBase } from '~shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { getFieldCreationMeta } from '~features/admin-form/create/builder-and-design/utils/fieldCreation'

import { EditRadio } from './EditRadio'

const DEFAULT_RADIO_FIELD = getFieldCreationMeta(
  BasicField.Radio,
) as RadioFieldBase

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
  args: {
    field: DEFAULT_RADIO_FIELD,
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
  field: {
    ...DEFAULT_RADIO_FIELD,
    title: 'Storybook Radio',
    description: 'Some description',
    fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
    othersRadioButton: true,
  },
}

export const Placeholders = Template.bind({})
Placeholders.args = {
  field: {
    ...DEFAULT_RADIO_FIELD,
    title: '',
    description: '',
    fieldOptions: [],
    required: false,
  },
}
