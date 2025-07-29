import { Meta, StoryFn } from '@storybook/react'

import { BasicField, SignatureFieldBase } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditSignature, EditSignatureProps } from './EditSignature'

const DEFAULT_SIGNATURE_FIELD: SignatureFieldBase = {
  title: 'Storybook Signature',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Signature,
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditSignature',
  component: EditSignature,
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
    field: DEFAULT_SIGNATURE_FIELD,
  },
} as Meta<EditSignatureProps>

const Template: StoryFn<EditSignatureProps> = ({ field }) => {
  return <EditSignature field={field} />
}
export const Default = Template.bind({})

export const WithValues = Template.bind({})
WithValues.args = {
  field: {
    ...DEFAULT_SIGNATURE_FIELD,
    title: 'Signature Field Title',
    description: 'Signature Field Description',
  },
}
