import { Meta, StoryFn } from '@storybook/react'

import { BasicField, MobileFieldBase } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditMobile } from './EditMobile'

const DEFAULT_MOBILE_FIELD: MobileFieldBase = {
  allowIntlNumbers: false,
  isVerifiable: false,
  title: 'Mobile Number',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Mobile,
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditMobile',
  component: EditMobile,
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
    msw: [...createFormBuilderMocks({}, 0)],
  },
  args: {
    field: DEFAULT_MOBILE_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: MobileFieldBase
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditMobile field={field} />
}

export const Default = Template.bind({})
Default.args = {
  field: {
    ...DEFAULT_MOBILE_FIELD,
    isVerifiable: true,
  },
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [...createFormBuilderMocks({}, 0)],
}
