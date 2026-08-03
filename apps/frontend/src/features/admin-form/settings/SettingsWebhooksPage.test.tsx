import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'

import * as stories from './SettingsWebhooksPage.stories'

const { MrfMode, StorageModeEmpty } = composeStories(stories)

const WORKFLOW_CALLOUT_TEXT = /can use data from all workflow steps/i

describe('SettingsWebhooksPage workflow callout visibility', () => {
  it('shows the callout on an MRF form', async () => {
    render(<MrfMode />)
    await screen.findByText('Endpoint URL')

    expect(screen.getByText(WORKFLOW_CALLOUT_TEXT)).toBeInTheDocument()
  })

  it('hides the callout on a Storage form', async () => {
    render(<StorageModeEmpty />)
    await screen.findByText('Endpoint URL')

    expect(screen.queryByText(WORKFLOW_CALLOUT_TEXT)).not.toBeInTheDocument()
  })
})
