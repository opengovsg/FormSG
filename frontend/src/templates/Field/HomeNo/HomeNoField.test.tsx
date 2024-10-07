import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REQUIRED_ERROR } from '~constants/validation'

import * as stories from './HomeNoField.stories'

const { ValidationRequired, ValidationOptional } = composeStories(stories)

describe('validation required', () => {
  it('renders error when field is not filled before submitting', async () => {
    // Arrange
    await act(async () => {
      render(<ValidationRequired />)
    })
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show error message.
    const error = screen.getByText(REQUIRED_ERROR)
    expect(error).not.toBeNull()
  })

  it('renders success when field has valid landline number when submitted', async () => {
    // Arrange
    const schema = ValidationRequired.args?.schema
    await act(async () => {
      render(<ValidationRequired />)
    })
    const input = screen.getByRole('textbox', {
      name: new RegExp(schema?.title ?? '', 'i'),
    }) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /submit/i })

    expect(input.value).toBe('')

    // Act
    // Valid landline number
    const validTestNumber = '61234567'
    await act(async () => userEvent.type(input, validTestNumber))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    const success = screen.getByText(
      `You have submitted: +65${validTestNumber}`,
    )
    expect(success).not.toBeNull()
    const error = screen.queryByText(REQUIRED_ERROR)
    expect(error).toBeNull()
  })
})

describe('validation optional', () => {
  it('renders success even when field is empty before submitting', async () => {
    // Arrange
    await act(async () => {
      render(<ValidationOptional />)
    })
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: Nothing was selected')
    expect(success).not.toBeNull()
  })

  it('renders success when field has valid landline number when submitted', async () => {
    // Arrange
    const schema = ValidationOptional.args?.schema
    await act(async () => {
      render(<ValidationOptional />)
    })
    const input = screen.getByRole('textbox', {
      name: new RegExp(schema?.title ?? '', 'i'),
    }) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /submit/i })

    expect(input.value).toBe('')

    // Act
    // Valid landline number
    const validTestNumber = '61234567'
    await act(async () => userEvent.type(input, validTestNumber))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    const success = screen.getByText(
      `You have submitted: +65${validTestNumber}`,
    )
    expect(success).not.toBeNull()
    const error = screen.queryByText(REQUIRED_ERROR)
    expect(error).toBeNull()
  })
})

describe('homeno input validation', () => {
  it('renders error when valid mobile number is submitted', async () => {
    // Arrange
    const schema = ValidationOptional.args?.schema
    await act(async () => {
      render(<ValidationOptional />)
    })
    const input = screen.getByRole('textbox', {
      name: new RegExp(schema?.title ?? '', 'i'),
    }) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /submit/i })

    expect(input.value).toBe('')

    // Act
    // Invalid landline number, mobile number instead
    const validTestNumber = '98765432'
    await act(async () => userEvent.type(input, validTestNumber))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show error message.
    const error = screen.queryByText(/Please enter a valid landline number/i)
    expect(error).not.toBeNull()
  })

  it('renders error when invalid landline number is submitted', async () => {
    // Arrange
    const schema = ValidationOptional.args?.schema
    await act(async () => {
      render(<ValidationOptional />)
    })
    const input = screen.getByRole('textbox', {
      name: new RegExp(schema?.title ?? '', 'i'),
    }) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /submit/i })

    expect(input.value).toBe('')

    // Act
    // Invalid landline number too short
    const validTestNumber = '1234'
    await act(async () => userEvent.type(input, validTestNumber))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show error message.
    const error = screen.queryByText(/Please enter a valid landline number/i)
    expect(error).not.toBeNull()
  })
})
