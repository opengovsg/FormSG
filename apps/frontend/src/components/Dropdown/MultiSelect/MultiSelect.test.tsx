import { render, screen } from '@testing-library/react'

import { ITEM_CHECKBOX_TEST_ID } from '../components/MultiDropdownItem/ItemCheckboxIcon'
import { ComboboxItem } from '../types'

import { MultiSelect } from './MultiSelect'

// The virtual list measures a viewport jsdom never gives it, so render rows eagerly.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data = [],
    itemContent,
  }: {
    data?: unknown[]
    itemContent: (index: number, item: unknown) => React.ReactNode
  }) => <>{data.map((item, index) => itemContent(index, item))}</>,
}))

const renderOpen = (items: ComboboxItem[]) =>
  render(
    <MultiSelect
      name="test-multiselect"
      items={items}
      values={[]}
      onChange={() => undefined}
      onBlur={() => undefined}
      defaultIsOpen
    />,
  )

describe('MultiSelect item checkboxes', () => {
  it('renders one for every ordinary item, whatever shape it takes', () => {
    renderOpen([
      'Alpha',
      { value: 'b', label: 'Bravo', disabled: true },
      { value: 'c', label: 'Charlie', description: 'Third' },
    ])

    expect(screen.getAllByTestId(ITEM_CHECKBOX_TEST_ID)).toHaveLength(3)
  })

  it('omits it for an isAction item, leaving the others untouched', () => {
    renderOpen([
      { value: 'a', label: 'Alpha' },
      { value: 'add', label: 'Add fields', isAction: true },
    ])

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Add fields')).toBeInTheDocument()
    expect(screen.getAllByTestId(ITEM_CHECKBOX_TEST_ID)).toHaveLength(1)
  })
})

describe('MultiSelect ownership status', () => {
  it('keeps an owned field visible and disabled with its ownership chip', () => {
    renderOpen([
      {
        value: 'owned',
        label: 'Myinfo name',
        disabled: true,
        descriptionTag: 'Assigned to Step 1',
      },
    ])
    expect(screen.getByText('Assigned to Step 1')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Myinfo name/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
