import { composeStories } from '@storybook/testing-react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REQUIRED_ERROR } from '~constants/validation'

import * as stories from './UenField.stories'

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

  it('renders success when field has valid UEN when submitted', async () => {
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
    // Valid UEN
    await user.type(input, '01234567A')
    await user.click(submitButton)

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

  it('renders success when field has valid UEN when submitted', async () => {
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
    await user.type(input, 'S01LP1234Z')
    await user.click(submitButton)

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
    const user = userEvent.setup()
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByLabelText(
      `${schema!.questionNumber}. ${schema!.title}`,
    ) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    await user.type(input, '0123456789')
    await user.click(submitButton)

    // Assert
    // Should show error message.
    const error = screen.getByText('Please enter a valid UEN')
    expect(error).not.toBeNull()
  })
})
