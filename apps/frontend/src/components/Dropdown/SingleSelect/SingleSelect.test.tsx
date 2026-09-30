import { render, screen } from '@testing-library/react'

import { SingleSelect } from './SingleSelect'

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

describe('SingleSelect menu placement', () => {
  it('keeps the menu inside its container when used in a modal', () => {
    const { container } = render(
      <SingleSelect
        name="modal-select"
        value="Short option"
        onChange={() => undefined}
        items={ITEMS}
        usePortal={false}
      />,
    )

    expect(container).toContainElement(
      screen.getByRole('listbox', { hidden: true }),
    )
  })

  it('retains the default portal behaviour for existing callers', () => {
    const { container } = render(
      <SingleSelect
        name="default-select"
        value="Short option"
        onChange={() => undefined}
        items={ITEMS}
      />,
    )

    expect(container).not.toContainElement(
      screen.getByRole('listbox', { hidden: true }),
    )
  })
})
