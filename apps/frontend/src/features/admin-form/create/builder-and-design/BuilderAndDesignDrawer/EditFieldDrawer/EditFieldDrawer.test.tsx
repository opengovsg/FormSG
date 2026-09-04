import { screen } from '@testing-library/react'

import { BasicField, FieldCreateDto } from 'formsg-shared/types/field'

import { render } from '~/test-utils'

import { getFieldCreationMeta } from '../../utils/fieldCreation'

import { MemoFieldDrawerContent } from './EditFieldDrawer'

vi.mock('~features/user/queries', () => ({
  useUser: () => ({ user: undefined, isLoading: false }),
}))

const TODO_PLACEHOLDER_TEXT = 'TODO: Insert field options here'

const getUnsupportedFieldMessage = (fieldType: string) =>
  `Unable to edit this field type (${fieldType}). Please contact support if this issue persists.`

describe('MemoFieldDrawerContent', () => {
  it('shows an unsupported field error for non-MyInfo children fields', () => {
    const field = getFieldCreationMeta(BasicField.Children)

    render(<MemoFieldDrawerContent field={field} />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      getUnsupportedFieldMessage(BasicField.Children),
    )
    expect(screen.queryByText(TODO_PLACEHOLDER_TEXT)).not.toBeInTheDocument()
  })

  it('shows an unsupported field error for an unregistered runtime field type', () => {
    const field = {
      ...getFieldCreationMeta(BasicField.ShortText),
      fieldType: 'unsupported_field' as BasicField,
    } as FieldCreateDto

    render(<MemoFieldDrawerContent field={field} />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      getUnsupportedFieldMessage('unsupported_field'),
    )
    expect(screen.queryByText(TODO_PLACEHOLDER_TEXT)).not.toBeInTheDocument()
  })
})
