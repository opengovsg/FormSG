import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'

import * as stories from './PublicFormPageMrfSubsequentSteps.stories'

const { WithSupersededStepLink, WithStoppedWorkflow } = composeStories(stories)

describe('PublicFormPage for subsequent MRF steps', () => {
  it('shows the superseded link message instead of the form when the server rejects the step token', async () => {
    await act(async () => {
      render(<WithSupersededStepLink />)
    })

    expect(
      await screen.findByText(
        'This link is no longer valid. The form admin may have sent this response back to an earlier step. Please use the latest link you were sent.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('This form is not available.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit/i })).toBeNull()
  })

  it('still shows the stopped workflow message', async () => {
    await act(async () => {
      render(<WithStoppedWorkflow />)
    })

    expect(
      await screen.findByText(/This workflow has been stopped/),
    ).toBeInTheDocument()
  })
})
