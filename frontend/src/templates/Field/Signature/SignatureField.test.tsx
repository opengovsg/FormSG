import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as stories from './SignatureField.stories'

const { ValidationRequired, ValidationNotRequired } = composeStories(stories)

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

  it('renders success when signature is drawn and form is submitted', async () => {
    // Arrange
    const user = userEvent.setup()
    const schema = ValidationRequired.args?.schema
    render(<ValidationRequired />)

    const submitButton = screen.getByText('Submit')

    const canvas = screen.getByLabelText(`Signature field ${schema?._id}`)
    expect(canvas).toBeInTheDocument()

    // Simulate a drawing sequence
    const rect = canvas.getBoundingClientRect()

    await user.pointer([
      {
        keys: '[MouseLeft]',
        target: canvas,
        coords: { x: rect.x + 10, y: rect.y + 10 },
      },
      { coords: { x: rect.x + 20, y: rect.y + 20 } },
      { coords: { x: rect.x + 30, y: rect.y + 30 } },
      { keys: '[/MouseLeft]' },
    ])

    // Act
    await user.click(submitButton)

    // Assert
    const success = screen.getByText(/you have submitted/i)
    expect(success).toBeInTheDocument()

    const error = screen.queryByText('This field is required')
    expect(error).not.toBeInTheDocument()
  })
})

describe('validation not required', () => {
  it('renders no error when field is not filled before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationNotRequired />)
    const submitButton = screen.getByText('Submit')

    // Act
    await user.click(submitButton)

    // Assert
    const success = screen.getByText(/you have submitted/i)
    expect(success).toBeInTheDocument()
  })
})
