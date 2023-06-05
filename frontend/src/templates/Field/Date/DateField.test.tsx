import { composeStories } from '@storybook/testing-react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDays, isBefore, lightFormat } from 'date-fns'

import { REQUIRED_ERROR } from '~constants/validation'

import { DATE_DISPLAY_FORMAT } from './DateField'
import * as stories from './DateField.stories'

const {
  ValidationOptional,
  ValidationRequired,
  ValidationNoFuture,
  ValidationNoPast,
  ValidationCustomRange,
} = composeStories(stories)

const { MOCKED_TODAY_DATE_STRING, MOCKED_TODAY_DATE } =
  stories.default.parameters?.test

describe('required field', () => {
  it('renders error when field is empty before submitting', async () => {
    // Arrange
    await act(async () => {
      // `defaultValue=undefined` so trigger does not run in the story.
      render(<ValidationRequired defaultValue={undefined} />)
    })
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show error message.
    expect(screen.getByText(REQUIRED_ERROR)).toBeInTheDocument()
  })
})

describe('optional field', () => {
  it('renders success even when field is empty before submitting', async () => {
    // Arrange
    await act(async () => {
      render(<ValidationOptional defaultValue={undefined} />)
    })
    const submitButton = screen.getByRole('button', { name: /submit/i })

    // Act
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    expect(screen.getByText(/you have submitted/i)).toBeInTheDocument()
  })

  it('renders success when submitting with valid date input', async () => {
    // Arrange
    const schema = ValidationOptional.args?.schema
    await act(async () => {
      render(<ValidationOptional defaultValue={undefined} />)
    })
    const input = screen.getByLabelText(
      new RegExp(schema!.title, 'i'),
    ) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /submit/i })

    expect(input.value).toBe('')

    // Act
    const validDate = '11/11/2011'
    await act(async () => userEvent.type(input, validDate))
    await act(async () => userEvent.click(submitButton))

    // Assert
    // Should show success message.
    const success = screen.getByText(`You have submitted: ${validDate}`)
    expect(success).not.toBeNull()
    const error = screen.queryByText('Please fill in required field')
    expect(error).toBeNull()
  })
})

describe('validation', () => {
  describe('ValidationNoFuture', () => {
    it('renders invalid date error when future date is selected', async () => {
      // Arrange
      const schema = ValidationNoFuture.args?.schema
      await act(async () => {
        render(<ValidationNoFuture defaultValue={undefined} />)
      })
      const input = screen.getByLabelText(
        new RegExp(schema!.title, 'i'),
      ) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /submit/i })

      expect(input.value).toBe('')

      // Act
      const invalidDate = '11/11/2031'
      await act(async () => userEvent.type(input, invalidDate))
      await act(async () => userEvent.click(submitButton))

      // Assert
      // Should show error message.
      const error = screen.queryByText('Only dates today or before are allowed')
      expect(error).not.toBeNull()
    })

    it('renders success when "today" is selected', async () => {
      // Arrange
      const schema = ValidationNoFuture.args?.schema
      await act(async () => {
        render(<ValidationNoFuture defaultValue={undefined} />)
      })
      const input = screen.getByLabelText(
        new RegExp(schema!.title, 'i'),
      ) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /submit/i })

      expect(input.value).toBe('')

      // Act
      await act(async () => userEvent.type(input, MOCKED_TODAY_DATE_STRING))
      await act(async () => userEvent.click(submitButton))

      // Assert
      // Should show success message.
      const success = screen.getByText(
        `You have submitted: ${MOCKED_TODAY_DATE_STRING}`,
      )
      expect(success).not.toBeNull()
    })

    it('renders success when non-future date is selected', async () => {
      // Arrange
      const schema = ValidationNoFuture.args?.schema
      await act(async () => {
        render(<ValidationNoFuture defaultValue={undefined} />)
      })
      const input = screen.getByLabelText(
        new RegExp(schema!.title, 'i'),
      ) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /submit/i })

      expect(input.value).toBe('')

      // Act
      const pastDate = lightFormat(
        addDays(MOCKED_TODAY_DATE, -10),
        DATE_DISPLAY_FORMAT,
      )
      await act(async () => userEvent.type(input, pastDate))
      await act(async () => userEvent.click(submitButton))

      // Assert
      // Should show success message.
      const success = screen.getByText(`You have submitted: ${pastDate}`)
      expect(success).not.toBeNull()
    })
  })

  describe('ValidationNoPast', () => {
    it('renders invalid date error when past date is selected', async () => {
      // Arrange
      const schema = ValidationNoPast.args?.schema
      await act(async () => {
        render(<ValidationNoPast defaultValue={undefined} />)
      })
      const input = screen.getByLabelText(
        new RegExp(schema!.title, 'i'),
      ) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /submit/i })

      expect(input.value).toBe('')

      // Act
      const pastDate = lightFormat(
        addDays(MOCKED_TODAY_DATE, -10),
        DATE_DISPLAY_FORMAT,
      )
      await act(async () => userEvent.type(input, pastDate))
      await act(async () => userEvent.click(submitButton))

      // Assert
      // Should show error message.
      const error = screen.queryByText('Only dates today or after are allowed')
      expect(error).not.toBeNull()
    })

    it('renders success when "today" is selected', async () => {
      // Arrange
      const schema = ValidationNoPast.args?.schema
      await act(async () => {
        render(<ValidationNoPast defaultValue={undefined} />)
      })
      const input = screen.getByLabelText(
        new RegExp(schema!.title, 'i'),
      ) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /submit/i })

      expect(input.value).toBe('')

      // Act
      await act(async () => userEvent.type(input, MOCKED_TODAY_DATE_STRING))
      await act(async () => userEvent.click(submitButton))

      // Assert
      // Should show success message.
      const success = screen.getByText(
        `You have submitted: ${MOCKED_TODAY_DATE_STRING}`,
      )
      expect(success).not.toBeNull()
    })

    it('renders success when future date is selected', async () => {
      // Arrange
      const schema = ValidationNoPast.args?.schema
      await act(async () => {
        render(<ValidationNoPast defaultValue={undefined} />)
      })
      const input = screen.getByLabelText(
        new RegExp(schema!.title, 'i'),
      ) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /submit/i })

      expect(input.value).toBe('')

      // Act
      const futureDate = lightFormat(
        addDays(MOCKED_TODAY_DATE, 5),
        DATE_DISPLAY_FORMAT,
      )
      await act(async () => userEvent.type(input, futureDate))
      await act(async () => userEvent.click(submitButton))

      // Assert
      // Should show success message.
      const success = screen.getByText(`You have submitted: ${futureDate}`)
      expect(success).not.toBeNull()
    })
  })

  describe('ValidationCustomRange', () => {
    it('renders invalid date error when date after max is selected', async () => {
      // Arrange
      const schema = ValidationCustomRange.args?.schema
      const { customMaxDate } = schema!.dateValidation
      await act(async () => {
        render(<ValidationCustomRange defaultValue={undefined} />)
      })
      const input = screen.getByLabelText(
        new RegExp(schema!.title, 'i'),
      ) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /submit/i })

      expect(input.value).toBe('')

      // Act
      const afterMaxDate = lightFormat(
        addDays(customMaxDate!, 10),
        DATE_DISPLAY_FORMAT,
      )
      await act(async () => userEvent.type(input, afterMaxDate))
      await act(async () => userEvent.click(submitButton))

      // Assert
      // Should show error message.
      const error = screen.queryByText(
        'Selected date is not within the allowed date range',
      )
      expect(error).not.toBeNull()
    })

    it('renders invalid date error when date before min is selected', async () => {
      // Arrange
      const schema = ValidationCustomRange.args?.schema
      const { customMinDate } = schema!.dateValidation
      await act(async () => {
        render(<ValidationCustomRange defaultValue={undefined} />)
      })
      const input = screen.getByLabelText(
        new RegExp(schema!.title, 'i'),
      ) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /submit/i })

      expect(input.value).toBe('')

      // Act
      const beforeMinDate = lightFormat(
        addDays(customMinDate!, -10),
        DATE_DISPLAY_FORMAT,
      )
      await act(async () => userEvent.type(input, beforeMinDate))
      await act(async () => userEvent.click(submitButton))

      // Assert
      // Should show error message.
      const error = screen.queryByText(
        'Selected date is not within the allowed date range',
      )
      expect(error).not.toBeNull()
    })

    it('renders success when selected date is in range', async () => {
      // Arrange
      const schema = ValidationCustomRange.args?.schema
      const { customMinDate, customMaxDate } = schema!.dateValidation
      await act(async () => {
        render(<ValidationCustomRange defaultValue={undefined} />)
      })
      const input = screen.getByLabelText(
        new RegExp(schema!.title, 'i'),
      ) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /submit/i })

      expect(input.value).toBe('')

      const inRangeDate = addDays(customMinDate!, 10)
      const inRangeDateString = lightFormat(inRangeDate, DATE_DISPLAY_FORMAT)
      // Should be in range.
      expect(isBefore(inRangeDate, customMaxDate!)).toEqual(true)

      // Act
      await act(async () => userEvent.type(input, inRangeDateString))
      await act(async () => userEvent.click(submitButton))

      // Assert
      // Should show success message.
      const success = screen.getByText(
        `You have submitted: ${inRangeDateString}`,
      )
      expect(success).not.toBeNull()
    })
  })
})
