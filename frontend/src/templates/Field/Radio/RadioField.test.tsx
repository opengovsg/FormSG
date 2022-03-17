import { composeStories } from '@storybook/testing-react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { REQUIRED_ERROR } from '~constants/validation'

import * as stories from './RadioField.stories'

const { ValidationOptional, ValidationRequired, WithoutOthersOption } =
  composeStories(stories)

describe('required field', () => {
  it('renders error when field is not selected before submitting', async () => {
    // Arrange
    await act(async () => {
      render(<ValidationRequired />)
    })
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show error message.
    expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument()
  })

  it('renders success when valid radio field selected when submitted (without others option)', async () => {
    // Arrange
    const radioOption =
      WithoutOthersOption.args?.schema?.fieldOptions?.[0] ?? ''
    await act(async () => {
      render(<WithoutOthersOption />)
    })
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const firstRadioButton = screen.getByLabelText(radioOption)

    // Act
    await act(async () => userEvent.click(firstRadioButton))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(
      screen.getByText(new RegExp(`{"value":"${radioOption}"}`, 'i')),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })

  it('renders success when valid radio field selected when submitted (with others option)', async () => {
    // Arrange
    const radioOption = ValidationRequired.args?.schema?.fieldOptions?.[0] ?? ''
    await act(async () => {
      render(<ValidationRequired />)
    })
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const firstRadioButton = screen.getByLabelText(radioOption)

    // Act
    await act(async () => userEvent.click(firstRadioButton))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(
      screen.getByText(
        new RegExp(`{"value":"${radioOption}","others-input":""}`, 'i'),
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })
})

describe('optional field', () => {
  it('renders success even when field is not selected before submitting', async () => {
    // Arrange
    await act(async () => {
      render(<ValidationOptional />)
    })
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(screen.getByText(/you have submitted/i)).toBeInTheDocument()
  })

  it('renders success when valid radio field selected when submitted', async () => {
    // Arrange
    const radioOption = ValidationOptional.args?.schema?.fieldOptions?.[3] ?? ''
    await act(async () => {
      render(<ValidationOptional />)
    })
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const firstRadioButton = screen.getByLabelText(radioOption)

    // Act
    await act(async () => userEvent.click(firstRadioButton))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(
      screen.getByText(
        new RegExp(`{"value":"${radioOption}","others-input":""}`, 'i'),
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(REQUIRED_ERROR)).not.toBeInTheDocument()
  })
})

describe('radio validation', () => {
  it('renders error when others option is submitted without filling in input', async () => {
    // Arrange
    await act(async () => {
      render(<ValidationRequired />)
    })
    const submitButton = screen.getByRole('button', { name: /submit/i })
    const otherRadioButton = screen.getByRole('radio', { name: /other/i })

    // Act
    await act(async () => userEvent.click(otherRadioButton))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show specific other required error message.
    expect(
      screen.getByText(/Please specify a value for the "others" option/i),
    ).toBeInTheDocument()
  })

  it('renders success when switching options before submitting', async () => {
    // Arrange
    await act(async () => {
      render(<ValidationRequired />)
    })
    const radioOption = ValidationOptional.args?.schema?.fieldOptions?.[3] ?? ''

    const submitButton = screen.getByRole('button', { name: /submit/i })
    const altRadioButton = screen.getByLabelText(radioOption)
    const otherRadioButton = screen.getByRole('radio', { name: /other/i })

    // Act
    await act(async () => userEvent.click(otherRadioButton))
    // Change radio option
    await act(async () => userEvent.click(altRadioButton))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(
      screen.getByText(
        new RegExp(`{"value":"${radioOption}","others-input":""}`, 'i'),
      ),
    ).toBeInTheDocument()
    // Other required error message should not be shown.
    expect(
      screen.queryByText(/Please specify a value for the "others" option/i),
    ).not.toBeInTheDocument()
  })
})
