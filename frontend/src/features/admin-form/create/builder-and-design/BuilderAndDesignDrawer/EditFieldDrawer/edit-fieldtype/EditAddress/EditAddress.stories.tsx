import { Meta, StoryFn } from '@storybook/react'

import { AddressFieldBase, BasicField } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditAddress, EditAddressProps } from './EditAddress'

const DEFAULT_ADDRESS_FIELD: AddressFieldBase = {
  title: 'Address field',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Address,
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditAddress',
  component: EditAddress,
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
    field: DEFAULT_ADDRESS_FIELD,
  },
} as Meta<EditAddressProps>

interface StoryArgs {
  field: AddressFieldBase
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditAddress field={field} />
}

export const Default = Template.bind({})

export const WithValues = Template.bind({})
WithValues.args = {
  field: {
    ...DEFAULT_ADDRESS_FIELD,
    title: 'Address Field Title',
    description: 'Address Field Description',
  },
}
