import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REQUIRED_ERROR } from '~constants/validation'

import * as stories from './CheckboxField.stories'
import { CHECKBOX_OTHERS_INPUT_KEY } from './constants'

const { ValidationOptional, ValidationRequired, WithoutOthersOption } =
  composeStories(stories)

describe('required field', () => {
  it('renders error when field is not selected before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await user.click(submitButton)

    // Assert
    // Should show error message.
    expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument()
  })

  it('renders success when checkbox fields are selected when submitted (without others option)', async () => {
    // Arrange
    const user = userEvent.setup()
    const checkboxOptions = WithoutOthersOption.args?.schema?.fieldOptions
    const checkboxOptionsToSelect = [
      checkboxOptions?.[0],
      checkboxOptions?.[2],
    ] as string[]

    render(<WithoutOthersOption />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    // Act
    await act(async () =>
      checkboxOptionsToSelect.forEach((optionVal) =>
        user.click(screen.getByLabelText(optionVal)),
      ),
    )
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(JSON.stringify(checkboxOptionsToSelect), {
        exact: false,
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })

  it('renders success when valid radio field selected when submitted (with others option)', async () => {
    // Arrange
    const user = userEvent.setup()
    const checkboxOption =
      ValidationRequired.args?.schema?.fieldOptions?.[0] ?? ''
    render(<ValidationRequired />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const firstCheckboxButton = screen.getByLabelText(checkboxOption)

    // Act
    await user.click(firstCheckboxButton)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(
        `{"value":["${checkboxOption}"],"${CHECKBOX_OTHERS_INPUT_KEY}":""}`,
        {
          exact: false,
        },
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })
})

describe('optional field', () => {
  it('renders success even when field is not selected before submitting', async () => {
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

  it('renders success when valid radio field selected when submitted', async () => {
    // Arrange
    const user = userEvent.setup()
    const checkboxOption =
      ValidationOptional.args?.schema?.fieldOptions?.[3] ?? ''
    render(<ValidationOptional />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const firstCheckboxButton = screen.getByLabelText(checkboxOption)

    // Act
    await user.click(firstCheckboxButton)
    await user.click(submitButton)

    // Assert
    // Should show success message.
    expect(
      screen.getByText(
        `{"value":["${checkboxOption}"],"${CHECKBOX_OTHERS_INPUT_KEY}":""}`,
        {
          exact: false,
        },
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })
})

describe('radio validation', () => {
  it('renders error when others option is checked without filling in input after submission', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const otherCheckboxOption = screen.getByRole('checkbox', { name: /other/i })

    // Act
    await user.click(otherCheckboxOption)
    await user.click(submitButton)

    // Assert
    // Should show specific other required error message.
    expect(
      screen.getByText(/Please specify a value for the "others" option/i),
    ).toBeInTheDocument()
  })

  it('renders success when unchecking some options before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const checkboxOptionLabel =
      ValidationOptional.args?.schema?.fieldOptions?.[3] ?? ''

    const submitButton = screen.getByRole('button', { name: /submit/i })
    const checkboxOption = screen.getByLabelText(checkboxOptionLabel)
    const otherCheckboxOption = screen.getByRole('checkbox', { name: /other/i })

    // Act
    await user.click(otherCheckboxOption)
    await user.click(checkboxOption)
    // Uncheck other option.
    await user.click(otherCheckboxOption)
    await user.click(submitButton)

    // Assert
    // Should show success message with only 1 checkbox option.
    expect(
      screen.getByText(
        `{"value":["${checkboxOptionLabel}"],"${CHECKBOX_OTHERS_INPUT_KEY}":""}`,
        { exact: false },
      ),
    ).toBeInTheDocument()
    // Other required error message should not be shown.
    expect(
      screen.queryByText(/Please specify a value for the "others" option/i),
    ).not.toBeInTheDocument()
  })
})
