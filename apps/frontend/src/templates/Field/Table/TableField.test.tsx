import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'

import * as stories from './TableField.stories'

const { DisabledWithLongDropdownOption } = composeStories(stories)

const LONG_DROPDOWN_OPTION =
  'This is a very long dropdown option label that should not be truncated when disabled'

describe('TableField — disabled dropdown column cell', () => {
  it('exposes the full selected dropdown label via a native title tooltip', () => {
    render(<DisabledWithLongDropdownOption />)

    // At least one row should expose the full label via title.
    const titled = screen.getAllByTitle(LONG_DROPDOWN_OPTION)
    expect(titled.length).toBeGreaterThan(0)
  })
})
