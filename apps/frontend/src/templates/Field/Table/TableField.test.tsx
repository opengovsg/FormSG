import { composeStories } from '@storybook/react'
import { render, screen, within } from '@testing-library/react'

import * as stories from './TableField.stories'

const {
  DisabledHighContrast,
  DisabledWithLongDropdownOption,
  ValidationValid,
} = composeStories(stories)

const LONG_DROPDOWN_OPTION =
  'This is a very long dropdown option label that should not be truncated when disabled'
const SHORT_TEXT_VALUE = 'This is a valid value'

describe('TableField — disabled dropdown column cell', () => {
  it('exposes the full selected dropdown label via a native title tooltip', () => {
    render(<DisabledWithLongDropdownOption />)

    // At least one row should expose the full label via title.
    const titled = screen.getAllByTitle(LONG_DROPDOWN_OPTION)
    expect(titled.length).toBeGreaterThan(0)
  })
})

describe('TableField — short text column cell', () => {
  it('exposes the cell value via a native title tooltip when disabled', () => {
    render(<DisabledHighContrast />)

    const table = screen.getByRole('table')
    const jobTitleInput = within(table).getAllByRole('textbox', {
      name: 'Job title',
    })[0]

    expect(jobTitleInput).toHaveAttribute('title', SHORT_TEXT_VALUE)
  })

  it('does not expose a native title tooltip when editable', () => {
    render(<ValidationValid />)

    const table = screen.getByRole('table')
    const jobTitleInput = within(table).getAllByRole('textbox', {
      name: 'Job title',
    })[0]

    expect(jobTitleInput).not.toHaveAttribute('title')
  })
})
