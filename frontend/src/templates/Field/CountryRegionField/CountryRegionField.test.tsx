import { composeStories } from '@storybook/testing-react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CountryRegion } from '~shared/constants/countryRegion'

import { REQUIRED_ERROR } from '~constants/validation'

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
    render(<ValidationRequired />)

    const dropdownOptions = Object.values(CountryRegion)
    const optionToType = dropdownOptions[0]
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Act
    userEvent.type(input, `${optionToType}{enter}`)
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

    const dropdownOptions = Object.values(CountryRegion)
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

    const expectedOption = 'SINGAPORE'
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Act
    userEvent.click(input)
    // Type the middle few characters of the option; dropdown should match properly,
    // then select the option.
    userEvent.type(input, `ingapor{arrowdown}{enter}`)
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

    const dropdownOptions: string[] = Object.values(CountryRegion)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const inputElement = screen.getByRole('textbox') as HTMLInputElement
    const inputToType = 'this is not a valid option'

    expect(dropdownOptions.includes(inputToType)).toEqual(false)

    // Act
    userEvent.click(inputElement)
    userEvent.type(inputElement, inputToType)
    userEvent.tab()
    // Input should blur and input value should be cleared (since nothing was selected).
    expect(inputElement.value).toEqual('')
    // Act required due to react-hook-form usage.
    await act(async () => userEvent.click(submitButton))

    // Assert
    expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument()
  })
})
