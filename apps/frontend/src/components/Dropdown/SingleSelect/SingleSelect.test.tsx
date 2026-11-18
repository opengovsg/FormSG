import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SingleSelect } from './SingleSelect'

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data = [],
    itemContent,
  }: {
    data?: unknown[]
    itemContent: (index: number, item: unknown) => React.ReactNode
  }) => <>{data.map((item, index) => itemContent(index, item))}</>,
}))

const LONG_LABEL =
  'This is a very long dropdown option label that should not be truncated when disabled and scrollable'

const ITEMS = [LONG_LABEL, 'Short option']

describe('SingleSelect — disabled scrollable selected label', () => {
  it('exposes the full selected label via title when isDisabled + isDisabledScrollable', () => {
    render(
      <SingleSelect
        name="test-select"
        value={LONG_LABEL}
        onChange={() => undefined}
        items={ITEMS}
        isDisabled
        isDisabledScrollable
      />,
    )

    expect(screen.getByTitle(LONG_LABEL)).toBeInTheDocument()
  })

  it('does not set a title on the selected label when isDisabledScrollable is not enabled', () => {
    render(
      <SingleSelect
        name="test-select"
        value={LONG_LABEL}
        onChange={() => undefined}
        items={ITEMS}
        isDisabled
      />,
    )

    expect(screen.queryByTitle(LONG_LABEL)).not.toBeInTheDocument()
  })
})

describe('SingleSelect — action items', () => {
  it('does not pick a highlighted action item when focus tabs away', async () => {
    const onChange = vi.fn()
    render(
      <SingleSelect
        name="test-select"
        value=""
        onChange={onChange}
        items={[{ value: '__add__', label: 'Add a field', isAction: true }]}
        isClearable={false}
      />,
    )

    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('option', { name: 'Add a field' })).toBeVisible()
    await userEvent.tab()

    expect(onChange).not.toHaveBeenCalled()
  })
})
