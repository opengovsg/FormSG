import { Meta, StoryFn } from '@storybook/react'

import {
  BasicField,
  FormFieldDto,
  MyInfoAttribute,
  MyInfoField,
} from 'formsg-shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditMyInfo } from './EditMyInfo'

type StoryField = MyInfoField & { _id: FormFieldDto['_id'] }

const DEFAULT_MYINFO_FIELD: StoryField = {
  title: 'Name',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.ShortText,
  myInfo: { attr: MyInfoAttribute.Name },
  ValidationOptions: { customVal: null, selectedValidation: null },
  globalId: 'unused',
  _id: 'myinfo_field_id',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditMyInfo',
  component: EditMyInfo,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
    EditFieldDrawerDecorator,
  ],
  parameters: {
    chromatic: { pauseAnimationAtEnd: true },
    msw: createFormBuilderMocks({}, 0),
  },
  args: {
    field: DEFAULT_MYINFO_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: StoryField
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditMyInfo field={field} />
}

export const Default = Template.bind({})
Default.storyName = 'EditMyInfo'
