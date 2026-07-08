import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'

import * as stories from './SettingsWebhooksPage.stories'

const {
  MrfMode,
  MrfModeMrfCutoverOn,
  StorageModeMrfCutoverOn,
  StorageModeEmpty,
} = composeStories(stories)

const WORKFLOW_CALLOUT_TEXT = /will receive workflow data from step 2 onwards/i

describe('SettingsWebhooksPage workflow callout visibility', () => {
  it('hides the callout on an MRF form when mrf-cutover is off', async () => {
    render(<MrfMode />)
    await screen.findByText('Endpoint URL')

    expect(screen.queryByText(WORKFLOW_CALLOUT_TEXT)).not.toBeInTheDocument()
  })

  it('hides the callout on a Storage form even when mrf-cutover is on', async () => {
    render(<StorageModeMrfCutoverOn />)
    await screen.findByText('Endpoint URL')

    expect(screen.queryByText(WORKFLOW_CALLOUT_TEXT)).not.toBeInTheDocument()
  })

  it('shows the callout on an MRF form when mrf-cutover is on', async () => {
    render(<MrfModeMrfCutoverOn />)
    await screen.findByText('Endpoint URL')

    expect(screen.getByText(WORKFLOW_CALLOUT_TEXT)).toBeInTheDocument()
  })

  it('hides the callout on a Storage form when mrf-cutover is off', async () => {
    render(<StorageModeEmpty />)
    await screen.findByText('Endpoint URL')

    expect(screen.queryByText(WORKFLOW_CALLOUT_TEXT)).not.toBeInTheDocument()
  })
})
