import { composeStories } from '@storybook/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from '~/i18n/setupI18nTests'

import * as stories from './ForceRefreshModal.stories'

const { BreakingChange, NonBreakingChange, UnknownClientVersion } =
  composeStories(stories)

// i18next's untyped `t` returns `TFunctionResult`; coerce for testing-library
// matchers.
const tr = (key: string): string => String(i18n.t(key))

describe('ForceRefreshModal', () => {
  it('should show a non-dismissible modal when the backend is a breaking version away', async () => {
    // Arrange
    const onRefresh = vi.fn()
    render(<BreakingChange onRefresh={onRefresh} />)

    // Assert: modal appears once the version query resolves.
    const refreshButton = await screen.findByRole('button', {
      name: tr('features.app.forceRefreshModal.refreshButton'),
    })
    expect(
      screen.getByText(tr('features.app.forceRefreshModal.title')),
    ).toBeInTheDocument()
    // No close button is rendered.
    expect(screen.queryByRole('button', { name: /close/i })).toBeNull()

    // Act: escape does not dismiss the modal.
    await userEvent.keyboard('{Escape}')
    expect(
      screen.getByText(tr('features.app.forceRefreshModal.title')),
    ).toBeInTheDocument()

    // Act: clicking refresh triggers the reload handler.
    await userEvent.click(refreshButton)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('should render nothing for a non-breaking newer backend version', async () => {
    // Arrange
    render(<NonBreakingChange />)

    // Assert: query resolves without the modal ever appearing.
    await waitFor(() =>
      expect(
        screen.queryByText(tr('features.app.forceRefreshModal.title')),
      ).toBeNull(),
    )
  })

  it('should render nothing when the bundle version is unknown (local dev)', async () => {
    // Arrange
    render(<UnknownClientVersion />)

    // Assert
    await waitFor(() =>
      expect(
        screen.queryByText(tr('features.app.forceRefreshModal.title')),
      ).toBeNull(),
    )
  })
})
