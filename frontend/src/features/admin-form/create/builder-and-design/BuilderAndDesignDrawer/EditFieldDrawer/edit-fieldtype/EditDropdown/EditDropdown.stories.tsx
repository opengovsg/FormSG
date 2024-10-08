import { Meta, StoryFn } from '@storybook/react'

import { BasicField, DropdownFieldBase } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditDropdown } from './EditDropdown'

const DEFAULT_DROPDOWN_FIELD: DropdownFieldBase = {
  title: 'Storybook Dropdown',
  description: 'Some description about Dropdown',
  required: true,
  disabled: false,
  fieldType: BasicField.Dropdown,
  fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditDropdown',
  component: EditDropdown,
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
    msw: createFormBuilderMocks({}, 0),
  },
  args: {
    field: DEFAULT_DROPDOWN_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: DropdownFieldBase
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditDropdown field={field} />
}

export const Default = Template.bind({})
Default.storyName = 'EditDropdown'
