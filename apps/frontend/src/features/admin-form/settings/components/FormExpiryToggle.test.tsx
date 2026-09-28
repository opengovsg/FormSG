import { composeStories } from '@storybook/react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as pageStories from '../SettingsGeneralPage.stories'

const { WithScheduledClosure } = composeStories(pageStories)

const openSettings = async () => {
  await act(async () => {
    render(<WithScheduledClosure />)
  })
  await screen.findByLabelText('Deadline time')
  return userEvent.setup()
}

describe('the deadline date', () => {
  it('saves the date on screen, not the last saved one, after a rejected edit', async () => {
    const ui = await openSettings()
    const dateInput = screen.getByPlaceholderText('dd/mm/yyyy')
    const timeInput = screen.getByLabelText('Deadline time')

    // An empty time is not a time, so the date edit is rejected unsaved.
    await ui.clear(timeInput)
    await act(async () => {
      fireEvent.change(dateInput, { target: { value: '20/12/2099' } })
    })
    expect(screen.getByText(/enter a valid time/i)).toBeInTheDocument()

    await ui.type(timeInput, '9:03')
    await ui.tab()

    expect(await screen.findByText(/Dec 2099/)).toBeInTheDocument()
  }, 20000)
})
