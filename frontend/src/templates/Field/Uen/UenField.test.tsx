import { composeStories } from '@storybook/testing-react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REQUIRED_ERROR } from '~constants/validation'

import * as stories from './UenField.stories'

const { ValidationRequired, ValidationOptional } = composeStories(stories)

describe('validation required', () => {
  it('renders error when field is not filled before submitting', async () => {
    // Arrange
    render(<ValidationRequired />)
    const submitButton = screen.getByText('Submit')

    // Act
    userEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show error message.
    const error = screen.getByText(REQUIRED_ERROR)
    expect(error).not.toBeNull()
  })

  it('renders success when field has valid UEN when submitted', async () => {
    // Arrange
    const schema = ValidationRequired.args?.schema
    render(<ValidationRequired />)
    const input = screen.getByLabelText(schema!.title) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    // Valid UEN
    userEvent.type(input, '01234567A')
    userEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: 01234567A')
    expect(success).not.toBeNull()
    const error = screen.queryByText('Please fill in required field')
    expect(error).toBeNull()
  })
})

describe('validation optional', () => {
  it('renders success even when field is empty before submitting', async () => {
    // Arrange
    render(<ValidationOptional />)
    const submitButton = screen.getByText('Submit')

    // Act
    userEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: Nothing was selected')
    expect(success).not.toBeNull()
  })

  it('renders success when field has valid UEN when submitted', async () => {
    // Arrange
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByLabelText(schema!.title) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    userEvent.type(input, 'S01LP1234Z')
    userEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: S01LP1234Z')
    expect(success).not.toBeNull()
    const error = screen.queryByText(REQUIRED_ERROR)
    expect(error).toBeNull()
  })
})

describe('uen validation', () => {
  it('renders error when invalid UEN is submitted', async () => {
    // Arrange
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByLabelText(schema!.title) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    userEvent.type(input, '0123456789')
    userEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show error message.
    const error = screen.getByText('Please enter a valid UEN')
    expect(error).not.toBeNull()
  })
})
