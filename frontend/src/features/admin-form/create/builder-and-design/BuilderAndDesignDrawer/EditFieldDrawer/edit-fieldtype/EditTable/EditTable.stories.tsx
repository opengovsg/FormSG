import { Meta, StoryFn } from '@storybook/react'

import { BasicField, TableFieldBase } from '~shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditTable, EditTableProps } from './EditTable'

const DEFAULT_TABLE_FIELD: TableFieldBase = {
  title: 'Storybook Table',
  description: 'Some description',
  addMoreRows: false,
  required: true,
  disabled: false,
  fieldType: BasicField.Table,
  minimumRows: 4,
  columns: [
    {
      ValidationOptions: {
        customVal: null,
        selectedValidation: null,
      },
      allowPrefill: false,
      columnType: BasicField.ShortText,
      title: 'Text Field',
      required: true,
    },
    {
      fieldOptions: ['Option 1', 'Option 2'],
      columnType: BasicField.Dropdown,
      required: false,
      title: 'Dropdown',
    },
    {
      ValidationOptions: {
        customVal: null,
        selectedValidation: null,
      },
      allowPrefill: false,
      columnType: BasicField.ShortText,
      required: true,
      title: 'Text Field',
    },
  ],
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditTable',
  component: EditTable,
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
    field: DEFAULT_TABLE_FIELD,
  },
} as Meta<EditTableProps>

const Template: StoryFn<EditTableProps> = ({ field }) => {
  return <EditTable field={field} />
}

export const Default = Template.bind({})

export const WithAddMoreRows = Template.bind({})
WithAddMoreRows.args = {
  field: {
    ...DEFAULT_TABLE_FIELD,
    addMoreRows: true,
    maximumRows: (DEFAULT_TABLE_FIELD.minimumRows || 0) - 1,
  },
}

export const WithSingleColumn = Template.bind({})
WithSingleColumn.args = {
  field: {
    ...DEFAULT_TABLE_FIELD,
    description: 'The button to remove a column should now be hidden',
    columns: DEFAULT_TABLE_FIELD.columns.slice(0, 1),
  },
}
