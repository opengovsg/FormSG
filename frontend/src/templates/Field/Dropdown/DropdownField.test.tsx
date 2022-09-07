import { composeStories } from '@storybook/testing-react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REQUIRED_ERROR } from '~constants/validation'

import * as stories from './DropdownField.stories'

const { ValidationOptional, ValidationRequired } = composeStories(stories)

describe('required field', () => {
  it('renders error when field is not selected before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const submitButton = screen.getByText(/submit/i)

    // Act
    await user.click(submitButton)

    // Assert
    // Should show error message.
    expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument()
  })

  it('renders success when a valid option is typed', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)

    const dropdownOptions = ValidationRequired.args?.schema
      ?.fieldOptions as string[]
    const expectedOption = dropdownOptions[0]
    const optionToType = expectedOption.slice(0, 6)
    const submitButton = screen.getByText(/submit/i)
    const input = screen.getByPlaceholderText(
      'Select an option',
    ) as HTMLInputElement
    // Act
    // Act required due to react-hook-form usage.
    await user.type(input, `${optionToType}[enter]`)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(`You have submitted: ${expectedOption}`),
    ).toBeInTheDocument()
  })

  it('renders success when a valid option is selected', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)

    const dropdownOptions = ValidationRequired.args?.schema
      ?.fieldOptions as string[]
    const expectedOption = dropdownOptions[1]
    const submitButton = screen.getByText(/submit/i)
    const input = screen.getByPlaceholderText(
      'Select an option',
    ) as HTMLInputElement
    // Act
    user.click(input)
    // Act required due to react-hook-form usage.
    // Arrow down twice and select input
    await user.type(input, '{arrowdown}{arrowdown}{enter}')
    await user.click(submitButton)

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
    const user = userEvent.setup()
    render(<ValidationOptional />)
    const submitButton = screen.getByText(/submit/i)

    // Act
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(screen.getByText(/you have submitted/i)).toBeInTheDocument()
  })

  it('renders success when a valid option is partially typed then selected', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationOptional />)

    const dropdownOptions = ValidationRequired.args?.schema
      ?.fieldOptions as string[]
    const expectedOption = dropdownOptions[1]
    const submitButton = screen.getByText(/submit/i)
    const input = screen.getByPlaceholderText(
      'Select an option',
    ) as HTMLInputElement
    // Act
    user.click(input)
    // Type the middle few characters of the option; dropdown should match properly,
    // then select the option.
    await user.type(input, `${expectedOption.slice(5, 16)}{arrowdown}{enter}`)
    // Act required due to react-hook-form usage.
    await user.click(submitButton)

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
    const user = userEvent.setup()
    render(<ValidationRequired />)

    const dropdownOptions = ValidationRequired.args?.schema
      ?.fieldOptions as string[]
    const submitButton = screen.getByText(/submit/i)
    const input = screen.getByPlaceholderText(
      'Select an option',
    ) as HTMLInputElement
    const inputToType = 'this is not a valid option'

    expect(dropdownOptions.includes(inputToType)).toEqual(false)

    // Act
    user.click(input)
    await act(() => {
      user.type(input, inputToType)
      return user.tab()
    })
    // Input should blur and input value should be cleared (since nothing was selected).
    expect(input.value).toEqual('')
    await userEvent.click(submitButton)

    // Assert
    expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument()
  })
})
