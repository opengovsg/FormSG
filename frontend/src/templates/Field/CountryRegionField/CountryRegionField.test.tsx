import { composeStories } from '@storybook/testing-react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REQUIRED_ERROR } from '~constants/validation'

import { SORTED_COUNTRY_OPTIONS } from './CountryRegionField'
import * as stories from './CountryRegionField.stories'

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
    const user = userEvent.setup()
    render(<ValidationRequired />)

    const optionToType = SORTED_COUNTRY_OPTIONS[0]
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Act
    await user.type(input, `${optionToType}{enter}`)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(`You have submitted: ${optionToType}`),
    ).toBeInTheDocument()
  })

  it('renders success when a valid option is selected', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)

    const expectedOption = SORTED_COUNTRY_OPTIONS[1]
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Act
    await user.click(input)
    // Arrow down twice and select input.
    // Third option should be selected since first option is already highlighted on click.
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
    const submitButton = screen.getByRole('button', { name: /submit/i })

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

    const expectedOption = 'Singapore'
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Act
    await user.click(input)
    // Type the middle few characters of the option; dropdown should match properly,
    // then select the option.
    await user.type(input, `ingapor{arrowdown}{enter}`)
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

    const dropdownOptions: string[] = SORTED_COUNTRY_OPTIONS
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const inputElement = screen.getByRole('textbox') as HTMLInputElement
    const inputToType = 'this is not a valid option'

    expect(dropdownOptions.includes(inputToType)).toEqual(false)

    // Act
    await user.click(inputElement)
    await user.type(inputElement, inputToType)
    await user.tab()
    // Input should blur and input value should be cleared (since nothing was selected).
    expect(inputElement.value).toEqual('')
    // Act required due to react-hook-form usage.
    await user.click(submitButton)

    // Assert
    expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument()
  })
})
