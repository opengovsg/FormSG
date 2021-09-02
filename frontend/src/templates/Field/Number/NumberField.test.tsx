import { composeStories } from '@storybook/testing-react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { merge } from 'lodash'

import { NumberSelectedValidation } from '~shared/types/field'

import * as stories from './NumberField.stories'

const { ValidationRequired, ValidationOptional } = composeStories(stories)

describe('validation required', () => {
  it('renders error when field is not filled before submitting', async () => {
    // Arrange
    render(<ValidationRequired />)
    const submitButton = screen.getByText('Submit')

    // Act
    userEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show error message.
    const error = screen.getByText('This field is required')
    expect(error).not.toBeNull()
  })

  it('renders success when field is filled when submitted', async () => {
    // Arrange
    const schema = ValidationRequired.args?.schema
    render(<ValidationRequired />)
    const input = screen.getByLabelText(schema!.title) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    userEvent.type(input, '123')
    userEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: 123')
    expect(success).not.toBeNull()
    const error = screen.queryByText('Please fill in required field')
    expect(error).toBeNull()
  })
})

describe('validation optional', () => {
  it('renders success even when field is empty before submitting', async () => {
    // Arrange
    render(<ValidationOptional />)
    const submitButton = screen.getByText('Submit')

    // Act
    userEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: Nothing was selected')
    expect(success).not.toBeNull()
  })

  it('renders success when field is filled when submitted', async () => {
    // Arrange
    const schema = ValidationOptional.args?.schema
    render(<ValidationOptional />)
    const input = screen.getByLabelText(schema!.title) as HTMLInputElement
    const submitButton = screen.getByText('Submit')

    expect(input.value).toBe('')

    // Act
    userEvent.type(input, '111')
    userEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: 111')
    expect(success).not.toBeNull()
    const error = screen.queryByText('Please fill in required field')
    expect(error).toBeNull()
  })
})

describe('text validation', () => {
  describe('NumberSelectedValidation.Min', () => {
    it('renders error when field input length is < minimum length when submitted', async () => {
      // Arrange
      // Using ValidationRequired base story to render the field without any value
      // and make validation options explicit.
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 8,
          selectedValidation: NumberSelectedValidation.Min,
        },
      })
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(schema!.title) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')

      // Act
      userEvent.type(input, '1234')
      userEvent.click(submitButton)
      await waitFor(() => submitButton.textContent !== 'Submitting')

      // Assert
      // Should show error validation message.
      const error = screen.getByText('Please enter at least 8 digits (4/8)')
      expect(error).not.toBeNull()
      const success = screen.queryByText('You have submitted')
      expect(success).toBeNull()
    })

    it('renders success when field input length is >= minimum length when submitted', async () => {
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 2,
          selectedValidation: NumberSelectedValidation.Min,
        },
      })
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(schema!.title) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')
      const inputString = '11111111'

      // Act
      userEvent.type(input, inputString)
      userEvent.click(submitButton)
      await waitFor(() => submitButton.textContent !== 'Submitting')

      // Assert
      // Should show success message.
      const success = screen.getByText(`You have submitted: ${inputString}`)
      expect(success).not.toBeNull()
    })
  })

  describe('TextSelectedValidation.Maximum', () => {
    it('renders error when field input length is > maximum length when submitted', async () => {
      // Arrange
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 2,
          selectedValidation: NumberSelectedValidation.Max,
        },
      })
      // Using ValidationRequired base story to render the field without any value.
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(schema!.title) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')

      // Act
      userEvent.type(input, '4444')
      userEvent.click(submitButton)
      await waitFor(() => submitButton.textContent !== 'Submitting')

      // Assert
      // Should show error validation message.
      const error = screen.getByText('Please enter at most 2 digits (4/2)')
      expect(error).not.toBeNull()
      const success = screen.queryByText('You have submitted')
      expect(success).toBeNull()
    })

    it('renders success when field input length is <= maximum length when submitted', async () => {
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 3,
          selectedValidation: NumberSelectedValidation.Max,
        },
      })
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(schema!.title) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')
      const inputString = '333'

      // Act
      userEvent.type(input, inputString)
      userEvent.click(submitButton)
      await waitFor(() => submitButton.textContent !== 'Submitting')

      // Assert
      // Should show success message.
      const success = screen.getByText(`You have submitted: ${inputString}`)
      expect(success).not.toBeNull()
    })
  })

  describe('TextSelectedValidation.Exact', () => {
    it('renders error when field input length not exact length when submitted', async () => {
      // Arrange
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 3,
          selectedValidation: NumberSelectedValidation.Exact,
        },
      })
      // Using ValidationRequired base story to render the field without any value.
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(schema!.title) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')

      // Act
      userEvent.type(input, '55555')
      userEvent.click(submitButton)
      await waitFor(() => submitButton.textContent !== 'Submitting')

      // Assert
      // Should show error validation message.
      const error = screen.getByText('Please enter 3 digits (5/3)')
      expect(error).not.toBeNull()
      const success = screen.queryByText('You have submitted')
      expect(success).toBeNull()
    })

    it('renders success when field input length is exact length when submitted', async () => {
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 5,
          selectedValidation: NumberSelectedValidation.Exact,
        },
      })
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(schema!.title) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')
      const inputString = '55555'

      // Act
      userEvent.type(input, inputString)
      userEvent.click(submitButton)
      await waitFor(() => submitButton.textContent !== 'Submitting')

      // Assert
      // Should show success message.
      const success = screen.getByText(`You have submitted: ${inputString}`)
      expect(success).not.toBeNull()
    })
  })
})
