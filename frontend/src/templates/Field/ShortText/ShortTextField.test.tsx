import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { merge } from 'lodash'

import { TextSelectedValidation } from '~shared/types/field'

import * as stories from './ShortTextField.stories'

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
    const error = screen.getByText('This field is required')
    expect(error).not.toBeNull()
  })

  it('renders success when field is filled when submitted', async () => {
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
    await user.type(input, 'test')
    await user.click(submitButton)

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: test')
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

  it('renders success when field is filled when submitted', async () => {
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
    await user.type(input, 'test again')
    await user.click(submitButton)

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: test again')
    expect(success).not.toBeNull()
    const error = screen.queryByText('Please fill in required field')
    expect(error).toBeNull()
  })
})

describe('text validation', () => {
  describe('TextSelectedValidation.Minimum', () => {
    it('renders error when field input length is < minimum length when submitted', async () => {
      // Arrange

      const user = userEvent.setup()
      // Using ValidationRequired base story to render the field without any value
      // and make validation options explicit.
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 8,
          selectedValidation: TextSelectedValidation.Minimum,
        },
      })
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(
        `${schema!.questionNumber}. ${schema!.title}`,
      ) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')

      // Act
      await user.type(input, 'test')
      await user.click(submitButton)

      // Assert
      // Should show error validation message.
      const error = screen.getByText('Please enter at least 8 characters (4/8)')
      expect(error).not.toBeNull()
      const success = screen.queryByText('You have submitted')
      expect(success).toBeNull()
    })

    it('renders success when field input length is >= minimum length when submitted', async () => {
      const user = userEvent.setup()
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 2,
          selectedValidation: TextSelectedValidation.Minimum,
        },
      })
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(
        `${schema!.questionNumber}. ${schema!.title}`,
      ) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')
      const inputString = 'above 2 characters'

      // Act
      await user.type(input, inputString)
      await user.click(submitButton)

      // Assert
      // Should show success message.
      const success = screen.getByText(`You have submitted: ${inputString}`)
      expect(success).not.toBeNull()
    })
  })

  describe('TextSelectedValidation.Maximum', () => {
    it('renders error when field input length is > maximum length when submitted', async () => {
      // Arrange
      const user = userEvent.setup()
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 2,
          selectedValidation: TextSelectedValidation.Maximum,
        },
      })
      // Using ValidationRequired base story to render the field without any value.
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(
        `${schema!.questionNumber}. ${schema!.title}`,
      ) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')

      // Act
      await user.type(input, 'above max')
      await user.click(submitButton)

      // Assert
      // Should show error validation message.
      const error = screen.getByText('Please enter at most 2 characters (9/2)')
      expect(error).not.toBeNull()
      const success = screen.queryByText('You have submitted')
      expect(success).toBeNull()
    })

    it('renders success when field input length is <= maximum length when submitted', async () => {
      const user = userEvent.setup()
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 14,
          selectedValidation: TextSelectedValidation.Maximum,
        },
      })
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(
        `${schema!.questionNumber}. ${schema!.title}`,
      ) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')
      const inputString = 'below or exact'

      // Act
      await user.type(input, inputString)
      await user.click(submitButton)

      // Assert
      // Should show success message.
      const success = screen.getByText(`You have submitted: ${inputString}`)
      expect(success).not.toBeNull()
    })
  })

  describe('TextSelectedValidation.Exact', () => {
    it('renders error when field input length not exact length when submitted', async () => {
      // Arrange
      const user = userEvent.setup()
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 3,
          selectedValidation: TextSelectedValidation.Exact,
        },
      })
      // Using ValidationRequired base story to render the field without any value.
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(
        `${schema!.questionNumber}. ${schema!.title}`,
      ) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')

      // Act
      await user.type(input, 'not three characters')
      await user.click(submitButton)

      // Assert
      // Should show error validation message.
      const error = screen.getByText('Please enter 3 characters (20/3)')
      expect(error).not.toBeNull()
      const success = screen.queryByText('You have submitted')
      expect(success).toBeNull()
    })

    it('renders success when field input length is exact length when submitted', async () => {
      const user = userEvent.setup()
      const schema = merge({}, ValidationRequired.args?.schema, {
        ValidationOptions: {
          customVal: 5,
          selectedValidation: TextSelectedValidation.Exact,
        },
      })
      render(<ValidationRequired schema={schema} />)
      const input = screen.getByLabelText(
        `${schema!.questionNumber}. ${schema!.title}`,
      ) as HTMLInputElement
      const submitButton = screen.getByText('Submit')

      expect(input.value).toBe('')
      const inputString = 'exact'

      // Act
      await user.type(input, inputString)
      await user.click(submitButton)

      // Assert
      // Should show success message.
      const success = screen.getByText(`You have submitted: ${inputString}`)
      expect(success).not.toBeNull()
    })
  })
})
