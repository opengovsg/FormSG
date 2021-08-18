import { composeStories } from '@storybook/testing-react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { BasicField } from '~shared/types/field'

import { YesNoFieldSchema } from './YesNoField'
import * as stories from './YesNoField.stories'

const { YesNoField } = composeStories(stories)

const mockSchema: YesNoFieldSchema = {
  title: 'Do you like apples',
  description:
    'Not oranges, not any other fruits. I only want to know your apple preferences.',
  required: true,
  disabled: false,
  fieldType: BasicField.YesNo,
  _id: '611b94dfbb9e300012f702a7',
}

it('renders error when field is not selected before submitting', async () => {
  // Arrange
  render(<YesNoField schema={mockSchema} />)
  const submitButton = screen.getByText('Submit')

  // Act
  fireEvent.click(submitButton)
  await waitFor(() => submitButton.textContent !== 'Submitting')

  // Assert
  // Should show error message.
  const error = screen.getByText('Please fill in required field')
  expect(error).not.toBeNull()
})

it('renders success when selected field is submitted', async () => {
  // Arrange
  render(<YesNoField schema={mockSchema} />)
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
