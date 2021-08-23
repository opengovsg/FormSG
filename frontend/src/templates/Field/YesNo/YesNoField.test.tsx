import { composeStories } from '@storybook/testing-react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { BasicField } from '~shared/types/field'

import { YesNoFieldSchema } from './YesNoField'
import * as stories from './YesNoField.stories'

const { ValidationOptional, ValidationRequired } = composeStories(stories)

const BASE_SCHEMA: YesNoFieldSchema = {
  title: 'Do you like apples',
  description:
    'Not oranges, not any other fruits. I only want to know your apple preferences.',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '611b94dfbb9e300012f702a7',
}

describe('ValidationRequired', () => {
  const MOCK_SCHEMA = BASE_SCHEMA

  it('renders error when field is not selected before submitting', async () => {
    // Arrange
    render(<ValidationRequired schema={MOCK_SCHEMA} />)
    const submitButton = screen.getByText('Submit')

    // Act
    fireEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show error message.
    const error = screen.getByText('This field is required')
    expect(error).not.toBeNull()
  })

  it('renders success when selected field is submitted', async () => {
    // Arrange
    render(<ValidationRequired schema={MOCK_SCHEMA} />)
    const noOption = screen.getByText('No')
    const yesOption = screen.getByText('Yes')
    const submitButton = screen.getByText('Submit')

    // Act
    // Test scenario where user changes their choice.
    fireEvent.click(noOption)
    fireEvent.click(yesOption)
    fireEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: yes')
    expect(success).not.toBeNull()
    const error = screen.queryByText('Please fill in required field')
    expect(error).toBeNull()
  })
})

describe('ValidationOptional', () => {
  const MOCK_SCHEMA = { ...BASE_SCHEMA, required: false }
  it('renders success even when field is not selected before submitting', async () => {
    // Arrange
    render(<ValidationOptional schema={MOCK_SCHEMA} />)
    const submitButton = screen.getByText('Submit')

    // Act
    fireEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: Nothing was selected')
    expect(success).not.toBeNull()
  })

  it('renders success when selected field is submitted', async () => {
    // Arrange
    render(<ValidationOptional schema={MOCK_SCHEMA} />)
    const noOption = screen.getByText('No')
    const yesOption = screen.getByText('Yes')
    const submitButton = screen.getByText('Submit')

    // Act
    // Test scenario where user changes their choice.
    fireEvent.click(yesOption)
    fireEvent.click(noOption)
    fireEvent.click(submitButton)
    await waitFor(() => submitButton.textContent !== 'Submitting')

    // Assert
    // Should show success message.
    const success = screen.getByText('You have submitted: no')
    expect(success).not.toBeNull()
  })
})
