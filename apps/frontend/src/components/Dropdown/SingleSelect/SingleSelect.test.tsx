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
