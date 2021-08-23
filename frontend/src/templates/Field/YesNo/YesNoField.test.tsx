import { composeStories } from '@storybook/testing-react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import * as stories from './YesNoField.stories'

const { ValidationOptional, ValidationRequired } = composeStories(stories)

describe('ValidationRequired', () => {
  it('renders error when field is not selected before submitting', async () => {
    // Arrange
    render(<ValidationRequired />)
    const submitButton = screen.getByText('Submit')

    // Act
    fireEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show error message.
    const error = screen.getByText('This field is required')
    expect(error).not.toBeNull()
  })

  it('renders success when selected field is submitted', async () => {
    // Arrange
    render(<ValidationRequired />)
    const noOption = screen.getByText('No')
    const yesOption = screen.getByText('Yes')
    const submitButton = screen.getByText('Submit')

    // Act
    // Test scenario where user changes their choice.
    fireEvent.click(noOption)
    fireEvent.click(yesOption)
    fireEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: yes')
    expect(success).not.toBeNull()
    const error = screen.queryByText('Please fill in required field')
    expect(error).toBeNull()
  })
})

describe('ValidationOptional', () => {
  it('renders success even when field is not selected before submitting', async () => {
    // Arrange
    render(<ValidationOptional />)
    const submitButton = screen.getByText('Submit')

    // Act
    fireEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: Nothing was selected')
    expect(success).not.toBeNull()
  })

  it('renders success when selected field is submitted', async () => {
    // Arrange
    render(<ValidationOptional />)
    const noOption = screen.getByText('No')
    const yesOption = screen.getByText('Yes')
    const submitButton = screen.getByText('Submit')

    // Act
    // Test scenario where user changes their choice.
    fireEvent.click(yesOption)
    fireEvent.click(noOption)
    fireEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: no')
    expect(success).not.toBeNull()
  })
})
