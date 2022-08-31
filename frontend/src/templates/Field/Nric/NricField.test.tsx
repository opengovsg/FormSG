import { composeStories } from '@storybook/testing-react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REQUIRED_ERROR } from '~constants/validation'

import * as stories from './NricField.stories'

const { ValidationRequired, ValidationOptional } = composeStories(stories)

describe('validation required', () => {
  it('renders error when field is not filled before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const submitButton = screen.getByText('Submit')

    // Act
    await user.click(submitButton)

    // Assert
    // Should show error message.
    const error = screen.getByText(REQUIRED_ERROR)
    expect(error).not.toBeNull()
  })

  it('renders success when field has valid NRIC when submitted', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationRequired.args?.schema
    render(<ValidationRequired />)
    const input = screen.getByLabelText(schema!.title) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    // Valid NRIC
    await user.type(input, 'S0000002G')
    await user.click(submitButton)

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: S0000002G')
    expect(success).not.toBeNull()
    const error = screen.queryByText('Please fill in required field')
    expect(error).toBeNull()
  })
})

describe('validation optional', () => {
  it('renders success even when field is empty before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationOptional />)
    const submitButton = screen.getByText('Submit')

    // Act
    await user.click(submitButton)

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: Nothing was selected')
    expect(success).not.toBeNull()
  })

  it('renders success when field has valid NRIC when submitted', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByLabelText(schema!.title) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    await user.type(input, 'S0000001I')
    await user.click(submitButton)

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: S0000001I')
    expect(success).not.toBeNull()
    const error = screen.queryByText(REQUIRED_ERROR)
    expect(error).toBeNull()
  })
})

describe('NRIC validation', () => {
  it('renders error when invalid NRIC is submitted', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByLabelText(schema!.title) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    await user.type(input, 'S0000001B')
    await user.click(submitButton)

    // Assert
    // Should show error message.
    const error = screen.getByText('Please enter a valid NRIC')
    expect(error).not.toBeNull()
  })
})
