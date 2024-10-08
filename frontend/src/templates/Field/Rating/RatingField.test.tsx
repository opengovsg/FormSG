import { composeStories } from '@storybook/react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { REQUIRED_ERROR } from '~constants/validation'

import * as stories from './RatingField.stories'

const { ValidationOptional, ValidationRequired } = composeStories(stories)

const SCHEMA_ID = ValidationRequired.args?.schema?._id

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
    const error = screen.getByText(REQUIRED_ERROR)
    expect(error).not.toBeNull()
  })

  it('renders success when selected field is submitted', async () => {
    // Arrange
    render(<ValidationRequired />)
    const threeOption = screen.getByTestId(`${SCHEMA_ID}-3`)
    const fiveOption = screen.getByTestId(`${SCHEMA_ID}-5`)
    const submitButton = screen.getByText('Submit')

    // Act
    // Test scenario where user changes their choice.
    fireEvent.click(threeOption)
    fireEvent.click(fiveOption)
    fireEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: 5')
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
    const twoOption = screen.getByTestId(`${SCHEMA_ID}-2`)
    const sixOption = screen.getByTestId(`${SCHEMA_ID}-6`)
    const submitButton = screen.getByText('Submit')

    // Act
    // Test scenario where user changes their choice.
    fireEvent.click(sixOption)
    fireEvent.click(twoOption)
    fireEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: 2')
    expect(success).not.toBeNull()
  })
})
