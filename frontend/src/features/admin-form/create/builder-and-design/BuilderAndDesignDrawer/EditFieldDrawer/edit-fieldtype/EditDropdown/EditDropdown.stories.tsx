import { Meta, StoryFn } from '@storybook/react'

import {
  BasicField,
  DropdownFieldBase,
  FormFieldDto,
  FormResponseMode,
  FormWorkflowStepDto,
  WorkflowType,
} from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditDropdown } from './EditDropdown'

const DEFAULT_DROPDOWN_FIELD: DropdownFieldBase & {
  _id: FormFieldDto['_id']
} = {
  title: 'Storybook Dropdown',
  description: 'Some description about Dropdown',
  required: true,
  disabled: false,
  fieldType: BasicField.Dropdown,
  fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
  globalId: 'unused',
  _id: 'dropdown_field_id',
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
  field: DropdownFieldBase & {
    _id: FormFieldDto['_id']
  }
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditDropdown field={field} />
}

export const Default = Template.bind({})
Default.storyName = 'EditDropdown'

const workflow_step_1: FormWorkflowStepDto = {
  _id: '61e6857c9c794b0012f1c6f8',
  workflow_type: WorkflowType.Static,
  emails: [],
  edit: [],
}

const workflow_step_2: FormWorkflowStepDto = {
  _id: '61e6857c9c794b0012f1c6f8',
  workflow_type: WorkflowType.Conditional,
  conditional_field: DEFAULT_DROPDOWN_FIELD._id,
  edit: [],
}

export const FieldUsedForConditionalRouting = Template.bind({})
FieldUsedForConditionalRouting.parameters = {
  msw: createFormBuilderMocks(
    {
      responseMode: FormResponseMode.Multirespondent,
      workflow: [workflow_step_1, workflow_step_2],
    },
    0,
  ),
}
