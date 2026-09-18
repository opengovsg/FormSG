import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'

import { useAdminWorkflowStore } from '../../../adminWorkflowStore'
import * as pageStories from '../../../CreatePageWorkflowTab.stories'

const { Step2NoEmails, WithWorkflow } = composeStories(pageStories)

const MISSING_FIELD = /this field is missing/i

describe('inactive step respondent badges', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

  it('flags a step whose specific emails are empty', async () => {
    await act(async () => {
      render(<Step2NoEmails />)
    })

    expect(
      await screen.findByText(MISSING_FIELD, {}, { timeout: 10000 }),
    ).toBeInTheDocument()
  })

  it('shows the emails, and no error, once they are filled in', async () => {
    await act(async () => {
      render(<WithWorkflow />)
    })

    expect(
      await screen.findByText('test_1@tech.gov.sg', {}, { timeout: 10000 }),
    ).toBeInTheDocument()
    expect(screen.queryByText(MISSING_FIELD)).not.toBeInTheDocument()
  })
})
