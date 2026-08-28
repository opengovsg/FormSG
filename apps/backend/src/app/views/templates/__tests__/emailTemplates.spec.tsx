import { render } from '@react-email/render'

import { EmailTemplate, WorkflowOutcome } from '../EmailTemplate'
import { FormScheduledClosureNotification } from '../FormScheduledClosureNotification'

/**
 * Snapshots of the rendered HTML, not of the component tree. Email markup is
 * the deliverable here — clients do not run our components, they receive this
 * string — so the snapshot is what a reviewer should be reading when a template
 * changes. It also pins the response email's output while the shared chrome is
 * pulled out from under it.
 */
describe('EmailTemplate', () => {
  it('should render a response notification with every section present', async () => {
    const html = await render(
      EmailTemplate({
        emailTitle: 'Response received',
        emailBody: 'Line one\nLine two',
        formTitle: 'Mock form',
        responseId: 'mock-response-id',
        timestamp: 'Thu, 28 Aug 2026, 10:03:41 AM',
        outcome: WorkflowOutcome.APPROVED,
        formQuestionAnswers: [
          { question: 'Q1', answer: 'A1' },
          { question: 'Q2', answer: 'multi\nline' },
        ],
        paymentAmount: 'S$10.00',
        statusTrackerUrl: 'https://form.gov.sg/track',
        reviewUrl: 'https://form.gov.sg/review',
        paymentUrl: 'https://form.gov.sg/pay',
        responseJson: '{"a":1}',
      }),
    )

    expect(html).toMatchSnapshot()
  })

  it('should render with only the required fields', async () => {
    const html = await render(
      EmailTemplate({ formTitle: 'Mock form', responseId: 'mock-response-id' }),
    )

    expect(html).toMatchSnapshot()
  })
})

describe('FormScheduledClosureNotification', () => {
  it('should render the closure notification', async () => {
    const html = await render(
      FormScheduledClosureNotification({
        formTitle: 'Mock form',
        formLink: 'https://form.gov.sg/mock-form-id',
        closedAt: 'Thu, 28 Aug 2026, 11:59 PM',
        appName: 'FormSG',
      }),
    )

    expect(html).toMatchSnapshot()
  })
})
