import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'

import { MRF_CUTOVER_FAQ_LINK } from 'formsg-shared/constants/links'

import { OGP_PLUMBER } from '~constants/links'

import * as stories from './WebhookWorkflowInfobox.stories'

const { Default } = composeStories(stories)

describe('WebhookWorkflowInfobox', () => {
  it('renders the workflow-data heads-up message', () => {
    render(<Default />)

    expect(
      screen.getByText(/will receive workflow data from step 2 onwards/i),
    ).toBeInTheDocument()
  })

  it('links "Plumber" to plumber.gov.sg', () => {
    render(<Default />)

    expect(screen.getByRole('link', { name: 'Plumber' })).toHaveAttribute(
      'href',
      OGP_PLUMBER,
    )
  })

  it('links "Learn more" to the simplified-modes FAQ', () => {
    render(<Default />)

    expect(screen.getByRole('link', { name: /learn more/i })).toHaveAttribute(
      'href',
      MRF_CUTOVER_FAQ_LINK,
    )
  })
})
