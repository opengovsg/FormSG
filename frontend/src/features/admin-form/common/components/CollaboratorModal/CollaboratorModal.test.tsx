import { composeStories } from '@storybook/testing-react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as stories from './CollaboratorModal.stories'

const { EditCollaboratorBadRequestError } = composeStories(stories)

describe('400 bad request error', () => {
  it('should throw the appropriate 400 error message when user attempts to add collaborator', async () => {
    await act(async () => {
      render(<EditCollaboratorBadRequestError />)
    })

    // Wait until msw has fetched all the necessary resources
    await waitFor(() =>
      expect(screen.getByText(/manage collaborators/i)).toBeVisible(),
    )

    const input = screen.getByPlaceholderText(/me@example.com/i)
    const submitButton = screen.getByRole('button', {
      name: /add collaborator/i,
    })
    const mockEmail = '123@open.gov.sg'

    await act(async () => userEvent.type(input, mockEmail))
    await act(async () => userEvent.click(submitButton))

    await screen.findByRole('alert')

    expect(screen.getByRole('alert').textContent).toBe(
      'Please ensure that the email entered is a valid government email. If the error still persists, refresh and try again later.',
    )
  })
})
