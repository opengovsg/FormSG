import { composeStories } from '@storybook/react-vite'
import { act, render, screen, within } from '@testing-library/react'

import { useAdminWorkflowStore } from '../../../adminWorkflowStore'
import * as pageStories from '../../../CreatePageWorkflowTab.stories'

const {
  Step1FieldsPickedOutOfOrder,
  Step2NoEmails,
  Step3Approval,
  StepLoginMixedProviders,
  WithWorkflow,
} = composeStories(pageStories)

const NO_EMAILS = /no emails added/i

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
      await screen.findByText(NO_EMAILS, {}, { timeout: 10000 }),
    ).toBeInTheDocument()
  })

  it('shows the emails, and no error, once they are filled in', async () => {
    await act(async () => {
      render(<WithWorkflow />)
    })

    expect(
      await screen.findByText('test_1@tech.gov.sg', {}, { timeout: 10000 }),
    ).toBeInTheDocument()
    expect(screen.queryByText(NO_EMAILS)).not.toBeInTheDocument()
  })

  it.each([
    ['stacked', Step3Approval, true, 'Fields to fill'],
    ['accordion', StepLoginMixedProviders, false, 'Assigned fields'],
  ] as const)(
    'matches the %s editor section order',
    async (_, Story, approvalFirst, fieldsLabel) => {
      await act(async () => {
        render(<Story />)
      })
      const card = within(
        await screen.findByRole(
          'button',
          { name: /approvals/i },
          { timeout: 10000 },
        ),
      )
      const approval = card.getByText('Approvals')
      const fields = card.getByText(fieldsLabel)
      expect(approval.compareDocumentPosition(fields)).toBe(
        approvalFirst
          ? Node.DOCUMENT_POSITION_FOLLOWING
          : Node.DOCUMENT_POSITION_PRECEDING,
      )
    },
  )

  it('lists the fields in question order, not the order they were picked', async () => {
    await act(async () => {
      render(<Step1FieldsPickedOutOfOrder />)
    })

    const first = await screen.findByText(
      /do you want to upload an attachment/i,
      {},
      { timeout: 10000 },
    )
    const second = screen.getByText(/are you really sure/i)
    expect(first.compareDocumentPosition(second)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })
})
