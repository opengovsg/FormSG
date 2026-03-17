import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REQUIRED_ERROR } from '~constants/validation'

import * as stories from './NricField.stories'

const { ValidationRequired, ValidationOptional } = composeStories(stories)

const VALID_NRIC = 'S0000002G'
const INVALID_NRIC = 'S0000001B'

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
    const input = screen.getByLabelText(
      `${schema!.questionNumber}. ${schema!.title}`,
    ) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    // Valid NRIC
    await user.type(input, VALID_NRIC)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    const success = screen.getByText(`You have submitted: ${VALID_NRIC}`)
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
    const input = screen.getByLabelText(
      `${schema!.questionNumber}. ${schema!.title}`,
    ) as HTMLInputElement
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
    const input = screen.getByLabelText(
      `${schema!.questionNumber}. ${schema!.title}`,
    ) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    await user.type(input, INVALID_NRIC)
    await user.click(submitButton)

    // Assert
    // Should show error message.
    const error = screen.getByText('Please enter a valid NRIC/FIN')
    expect(error).not.toBeNull()
  })
})

describe('NRIC field input', () => {
  it('handles leading spaces', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByLabelText(
      `${schema!.questionNumber}. ${schema!.title}`,
    ) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    await user.type(input, ` ${VALID_NRIC}`)

    expect(input.value).toBe(VALID_NRIC)

    await user.click(submitButton)

    // Assert
    // Should show error message.
    const error = screen.getByText(`You have submitted: ${VALID_NRIC}`)
    expect(error).not.toBeNull()
  })

  it('handles trailing spaces and renders no errors', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByLabelText(
      `${schema!.questionNumber}. ${schema!.title}`,
    ) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    await user.type(input, `${VALID_NRIC} `)
    await user.click(submitButton)

    // Assert
    // Should show error message.
    const error = screen.getByText(`You have submitted: ${VALID_NRIC}`)
    expect(error).not.toBeNull()
  })
})
