import { composeStories } from '@storybook/testing-react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  INVALID_DROPDOWN_OPTION_ERROR,
  REQUIRED_ERROR,
} from '~constants/validation'

import * as stories from './DropdownField.stories'

const { ValidationOptional, ValidationRequired } = composeStories(stories)

describe('required field', () => {
  it('renders error when field is not selected before submitting', async () => {
    // Arrange
    render(<ValidationRequired />)
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show error message.
    expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument()
  })

  it('renders success when a valid option is typed', async () => {
    // Arrange
    render(<ValidationRequired />)

    const dropdownOptions = ValidationRequired.args?.schema
      ?.fieldOptions as string[]
    const optionToType = dropdownOptions[0]
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Act
    userEvent.type(input, optionToType)
    // Act required due to react-hook-form usage.
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(
      screen.getByText(`You have submitted: ${optionToType}`),
    ).toBeInTheDocument()
  })

  it('renders success when a valid option is selected', async () => {
    // Arrange
    render(<ValidationRequired />)

    const dropdownOptions = ValidationRequired.args?.schema
      ?.fieldOptions as string[]
    const expectedOption = dropdownOptions[1]
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Act
    userEvent.click(input)
    // Arrow down twice and select input
    userEvent.type(input, '{arrowdown}{arrowdown}{enter}')
    // Act required due to react-hook-form usage.
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(
      screen.getByText(`You have submitted: ${expectedOption}`),
    ).toBeInTheDocument()
  })
})

describe('optional field', () => {
  it('renders success even when field has no input before submitting', async () => {
    // Arrange
    render(<ValidationOptional />)
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(screen.getByText(/you have submitted/i)).toBeInTheDocument()
  })

  it('renders success when a valid option is partially typed then selected', async () => {
    // Arrange
    render(<ValidationOptional />)

    const dropdownOptions = ValidationRequired.args?.schema
      ?.fieldOptions as string[]
    const expectedOption = dropdownOptions[1]
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Act
    userEvent.click(input)
    // Type the middle few characters of the option; dropdown should match properly,
    // then select the option.
    userEvent.type(input, `${expectedOption.slice(5, 16)}{arrowdown}{enter}`)
    // Act required due to react-hook-form usage.
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(
      screen.getByText(`You have submitted: ${expectedOption}`),
    ).toBeInTheDocument()
  })
})

describe('dropdown validation', () => {
  it('renders error when input does not match any dropdown option', async () => {
    // Arrange
    render(<ValidationRequired />)

    const dropdownOptions = ValidationRequired.args?.schema
      ?.fieldOptions as string[]
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const inputElement = screen.getByRole('textbox') as HTMLInputElement
    const inputToType = 'this is not a valid option'

    expect(dropdownOptions.includes(inputToType)).toEqual(false)

    // Act
    userEvent.click(inputElement)
    // Arrow down twice and select input
    userEvent.type(inputElement, inputToType)
    // Act required due to react-hook-form usage.
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(screen.getByText(INVALID_DROPDOWN_OPTION_ERROR)).toBeInTheDocument()
  })
})
