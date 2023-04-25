import { composeStories } from '@storybook/testing-react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as stories from './TransferOwnershipModal.stories'

const { Default } = composeStories(stories)

describe('User transfers ownership of all owned forms', () => {
  it('should render modal with validation triggered', async () => {
    // Arrange
    await act(async () => {
      render(<Default />)
    })
    // Wait until all async stuff has rendered
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/loading.*/i)).toBeNull(),
    )
    const input = screen.getByRole('textbox', {
      name: /transfer ownership/i,
    }) as HTMLInputElement
    const transferButton = screen.getByRole('button', {
      name: /transfer ownership/i,
    })

    // Assert
    // Should be empty value
    expect(input).toHaveDisplayValue('')
    // Transfer button should be disabled.
    expect(transferButton).toBeDisabled()
  })

  it('should transfer ownership successfully', async () => {
    // Arrange
    await act(async () => {
      render(<Default />)
    })
    // Wait until all async stuff has rendered
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/loading.*/i)).toBeNull(),
    )
    const input = screen.getByRole('textbox', {
      name: /transfer ownership/i,
    }) as HTMLInputElement
    const transferButton = screen.getByRole('button', {
      name: /transfer ownership/i,
    })
    const newOwnerEmail = 'admin2@example.com'

    // Act
    await act(async () => userEvent.type(input, newOwnerEmail))
    await act(async () => userEvent.tab())
    expect(transferButton).toHaveTextContent('Transfer ownership')
    expect(input).toHaveDisplayValue(newOwnerEmail)
    await act(async () => userEvent.click(transferButton))

    // Assert
    const confirmButton = screen.getByRole('button', {
      name: /yes, transfer all forms/i,
    })
    expect(confirmButton).toBeInTheDocument()

    // Act
    await act(async () => userEvent.click(confirmButton))

    // Assert
    // Toast should appear.
    expect(screen.getByText(/ownership transferred\./i)).toBeInTheDocument()
  })

  it('should disable ownership transfer to self', async () => {
    // Arrange
    await act(async () => {
      render(<Default />)
    })
    // Wait until all async stuff has rendered
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/loading.*/i)).toBeNull(),
    )
    const input = screen.getByRole('textbox', {
      name: /transfer ownership/i,
    }) as HTMLInputElement
    const transferButton = screen.getByRole('button', {
      name: /transfer ownership/i,
    })
    const newOwnerEmail = 'admin@example.com'

    // Act
    await act(async () => userEvent.type(input, newOwnerEmail))
    await act(async () => userEvent.tab())

    // Assert
    expect(transferButton).toBeDisabled()
  })
})
