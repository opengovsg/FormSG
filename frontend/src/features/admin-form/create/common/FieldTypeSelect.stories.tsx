import { Meta, StoryObj } from '@storybook/react'
import { expect, screen, userEvent, within } from '@storybook/test'

import { BasicField, FormFieldDto } from '~shared/types'

import {
  FieldBuilderState,
  useFieldBuilderStore,
} from '../builder-and-design/useFieldBuilderStore'
import { getFieldCreationMeta } from '../builder-and-design/utils/fieldCreation'

import { FieldTypeSelect } from './CreatePageDrawer/FieldTypeSelect'

const meta = {
  title: 'Features/AdminForm/Create/Common/FieldTypeSelect',
  component: FieldTypeSelect,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FieldTypeSelect>

export default meta
type Story = StoryObj<typeof meta>

// export const Default: Story = {
//   args: {},
// }

export const WithLongTextFieldType: Story = {
  decorators: [
    (Story) => {
      const store = useFieldBuilderStore.getState()
      store.updateCreateState(getFieldCreationMeta(BasicField.LongText), 0)
      return <Story />
    },
  ],
}

export const WithUnsupportedFieldType: Story = {
  decorators: [
    (Story) => {
      const store = useFieldBuilderStore.getState()
      store.updateCreateState(
        {
          fieldType: 'undefined',
          title: '',
          description: '',
          required: true,
          disabled: false,
        } as unknown as FormFieldDto,
        0,
      )
      return <Story />
    },
  ],
}

export const WithFieldTypeSearch: Story = {
  decorators: [
    (Story) => {
      const store = useFieldBuilderStore.getState()
      store.updateCreateState(getFieldCreationMeta(BasicField.ShortText), 0)
      return <Story />
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Click the select dropdown
    const selectButton = canvas.getByRole('combobox')
    await userEvent.click(selectButton)

    // Filter for number field
    await userEvent.type(selectButton, 'number')

    // Wait for the dropdown menu to appear and verify filtered options
    // The menu is rendered in a portal, so we need to look for it in the document
    const options = await screen.findAllByRole('option')
    expect(options.length).toBe(3)
    expect(options[0]).toHaveTextContent(/number/i)
    expect(options[1]).toHaveTextContent(/home number/i)
    expect(options[2]).toHaveTextContent(/mobile number/i)
  },
}

export const WithFieldTypeChange: Story = {
  decorators: [
    (Story) => {
      const store = useFieldBuilderStore.getState()
      store.updateCreateState(getFieldCreationMeta(BasicField.ShortText), 0)
      return <Story />
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify initial field type is ShortText
    const initialStore = useFieldBuilderStore.getState()
    expect(initialStore.stateData.state).toBe(FieldBuilderState.CreatingField)
    expect(
      (initialStore.stateData as { field: { fieldType: BasicField } }).field
        .fieldType,
    ).toBe(BasicField.ShortText)

    // Click the select dropdown
    const selectButton = canvas.getByRole('combobox')
    await userEvent.click(selectButton)

    // Filter for email field
    await userEvent.type(selectButton, 'email')

    // Wait for the dropdown menu to appear and verify filtered options
    // The menu is rendered in a portal, so we need to look for it in the document
    const options = await screen.findAllByRole('option')
    expect(options.length).toBe(1)
    expect(options[0]).toHaveTextContent(/email/i)

    // Click the Email option
    await userEvent.click(options[0])

    // Verify changeFieldType was called with Email
    const store = useFieldBuilderStore.getState()
    expect(store.stateData.state).toBe(FieldBuilderState.CreatingField)
    expect(
      (store.stateData as { field: { fieldType: BasicField } }).field.fieldType,
    ).toBe(BasicField.Email)
  },
}
