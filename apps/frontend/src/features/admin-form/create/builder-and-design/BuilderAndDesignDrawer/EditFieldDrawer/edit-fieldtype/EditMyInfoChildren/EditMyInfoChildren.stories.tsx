import { Meta, StoryFn } from '@storybook/react'

import {
  BasicField,
  FormFieldDto,
  MyInfoAttribute,
  MyInfoChildAttributes,
} from 'formsg-shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditMyInfoChildren } from './EditMyInfoChildren'
import { ChildrenCompoundFieldMyInfo } from '.'

type StoryField = ChildrenCompoundFieldMyInfo & { _id: FormFieldDto['_id'] }

const DEFAULT_CHILDREN_FIELD: StoryField = {
  title: 'Child',
  description: '',
  required: true,
  disabled: false,
  fieldType: BasicField.Children,
  childrenSubFields: [MyInfoChildAttributes.ChildName],
  myInfo: { attr: MyInfoAttribute.ChildrenBirthRecords },
  globalId: 'unused',
  _id: 'children_field_id',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditMyInfoChildren',
  component: EditMyInfoChildren,
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
    field: DEFAULT_CHILDREN_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: StoryField
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditMyInfoChildren field={field} />
}

export const Default = Template.bind({})
Default.storyName = 'EditMyInfoChildren'
