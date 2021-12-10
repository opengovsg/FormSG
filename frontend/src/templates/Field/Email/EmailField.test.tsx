import { composeStories } from '@storybook/testing-react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  INVALID_EMAIL_DOMAIN_ERROR,
  INVALID_EMAIL_ERROR,
  REQUIRED_ERROR,
} from '~constants/validation'

import * as stories from './EmailField.stories'

const { ValidationRequired, ValidationOptional, ValidationAllowedDomain } =
  composeStories(stories)

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
    expect(screen.getByText(REQUIRED_ERROR)).not.toBeNull()
  })

  it('renders success when field has valid email when submitted', async () => {
    // Arrange
    const inputLabel = ValidationRequired.args?.schema?.title ?? ''
    expect(inputLabel).not.toEqual('')
    await act(async () => {
      render(<ValidationRequired />)
    })
    const input = screen.getByRole('textbox', {
      name: new RegExp(inputLabel, 'i'),
    }) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /submit/i })
    expect(input.value).toBe('')

    const expectedValue = 'test@example.com'

    // Act
    // Valid NRIC
    await act(async () => userEvent.type(input, expectedValue))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(
      screen.getByText(`You have submitted: ${expectedValue}`),
    ).not.toBeNull()
    expect(screen.queryByText(REQUIRED_ERROR)).toBeNull()
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
    expect(
      screen.getByText('You have submitted: Nothing was selected'),
    ).not.toBeNull()
  })

  it('renders success when field has valid email when submitted', async () => {
    // Arrange
    const inputLabel = ValidationOptional.args?.schema?.title ?? ''
    expect(inputLabel).not.toEqual('')
    await act(async () => {
      render(<ValidationRequired />)
    })
    const input = screen.getByRole('textbox', {
      name: new RegExp(inputLabel, 'i'),
    }) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /submit/i })
    expect(input.value).toBe('')

    const expectedValue = 'test-again@example.com'

    // Act
    // Valid NRIC
    await act(async () => userEvent.type(input, expectedValue))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(
      screen.getByText(`You have submitted: ${expectedValue}`),
    ).not.toBeNull()
    expect(screen.queryByText(REQUIRED_ERROR)).toBeNull()
  })
})

describe('email validation', () => {
  it('renders error when invalid email is submitted', async () => {
    // Arrange
    const inputLabel = ValidationOptional.args?.schema?.title ?? ''
    expect(inputLabel).not.toEqual('')
    await act(async () => {
      render(<ValidationOptional />)
    })
    const input = screen.getByLabelText(inputLabel) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /submit/i })

    expect(input.value).toBe('')

    // Act
    await act(async () => userEvent.type(input, 'S0000001B'))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show error message.
    expect(screen.getByText(INVALID_EMAIL_ERROR)).not.toBeNull()
  })

  it('renders error when email with disallowed email domain is submitted', async () => {
    // Arrange
    const schema = ValidationAllowedDomain.args?.schema
    const inputLabel = schema?.title ?? ''
    expect(inputLabel).not.toEqual('')
    await act(async () => {
      render(<ValidationOptional schema={schema} />)
    })
    const input = screen.getByLabelText(inputLabel) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /submit/i })

    expect(input.value).toBe('')

    const validEmailButInvalidDomain = 'only-govsg-emails@example.com'

    // Act
    await act(async () => userEvent.type(input, validEmailButInvalidDomain))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show error message.
    expect(screen.getByText(INVALID_EMAIL_DOMAIN_ERROR)).not.toBeNull()
  })
})
