import { screen, within } from '@testing-library/react'

import {
  AdminWorkflowEventDto,
  AdminWorkflowEventType,
  DateString,
  StepSubmittedEventDto,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import { enSG } from '~/i18n/locales/features/admin-form/responses/individual-response/en-sg'
import { render } from '~/test-utils'

import { WorkflowActivityLog } from './WorkflowActivityLog'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values: Record<string, unknown> = {}) => {
      const copy = enSG.workflowActions.activityLog as Record<string, string>
      return (copy[key.split('.').pop()!] ?? key).replace(
        /\{(\w+)\}/g,
        (_, name: string) => String(values[name] ?? ''),
      )
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}))
const event = (
  type: AdminWorkflowEventType,
  created: string,
  emails: string[],
): AdminWorkflowEventDto => ({
  type,
  actorEmail: 'admin@agency.gov.sg',
  stepNumber: 2,
  emails,
  created: created as DateString,
})
const at = '2026-10-08T01:00:00.000Z'
const history = {
  submittedSteps: [
    {
      isApproval: false as const,
      submittedAt: at,
      nextStepRecipientEmails: ['lead@agency.gov.sg'],
    },
  ],
  workflow: [
    { _id: 'step-1', step_name: 'Applicant' },
    { _id: 'step-2', step_name: 'Team lead' },
    { _id: 'step-3' },
  ],
}
const stepSubmitted = (
  stepNumber: number,
  created: string,
  emails: string[],
  outcome: StepSubmittedEventDto['outcome'] = WorkflowStatus.COMPLETED,
): StepSubmittedEventDto => ({
  type: WorkflowEventType.StepSubmitted,
  stepNumber,
  outcome,
  emails,
  created: created as DateString,
})
const twoSubmittedSteps = [
  history.submittedSteps[0],
  {
    isApproval: true as const,
    status: WorkflowStatus.APPROVED as const,
    submittedAt: '2026-10-08T02:00:00.000Z',
    nextStepRecipientEmails: ['changed@agency.gov.sg'],
  },
]
const titles = () =>
  screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent)

describe('WorkflowActivityLog', () => {
  it('keeps action and sending entries adjacent, oldest first, including timestamp ties', () => {
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          workflowEvents: [
            event(WorkflowEventType.Stopped, '2026-10-08T04:00:00.000Z', [
              'notify@agency.gov.sg',
            ]),
            event(WorkflowEventType.AssigneesAdded, at, [
              'new@agency.gov.sg',
              'other@agency.gov.sg',
            ]),
            event(WorkflowEventType.ReminderSent, '2026-10-08T03:00:00.000Z', [
              'lead@agency.gov.sg',
              'new@agency.gov.sg',
            ]),
          ],
        }}
      />,
    )
    expect(titles()).toEqual([
      'Step 1 submitted',
      'Step 2 · Team lead sent to lead@agency.gov.sg',
      'new@agency.gov.sg and other@agency.gov.sg added to Step 2 · Team lead by admin@agency.gov.sg',
      'Reminder triggered for Step 2 · Team lead by admin@agency.gov.sg',
      'Reminder for Step 2 · Team lead sent to lead@agency.gov.sg and new@agency.gov.sg',
      'Workflow stopped by admin@agency.gov.sg',
    ])
    const items = screen.getAllByRole('listitem')
    expect(
      within(items[0]).getByText('Thu, 8 Oct 2026, 09:00:00 AM'),
    ).toBeInTheDocument()
    expect(
      within(items[1]).getByText('Thu, 8 Oct 2026, 09:00:00 AM'),
    ).toBeInTheDocument()
    expect(
      within(items[5]).getByText('Notification recipients'),
    ).toBeInTheDocument()
    expect(
      within(items[5]).getByText('notify@agency.gov.sg'),
    ).toBeInTheDocument()
  })
  it('names approval decisions without inventing actors or sending after rejection', () => {
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          submittedSteps: [
            history.submittedSteps[0],
            {
              isApproval: true,
              status: WorkflowStatus.REJECTED,
              submittedAt: '2026-10-08T02:00:00.000Z',
              nextStepRecipientEmails: ['unused@agency.gov.sg'],
            },
          ],
        }}
      />,
    )
    expect(titles()).toEqual([
      'Step 1 submitted',
      'Step 2 · Team lead sent to lead@agency.gov.sg',
      'Step 2 · Team lead rejected',
    ])
    expect(screen.queryByText(/unused@/)).not.toBeInTheDocument()
  })
  it('preserves an approval outcome on the first step and routes to the next named step', () => {
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          submittedSteps: [
            {
              isApproval: true,
              status: WorkflowStatus.APPROVED,
              submittedAt: at,
              nextStepRecipientEmails: ['lead@agency.gov.sg'],
            },
          ],
        }}
      />,
    )
    expect(titles()).toEqual([
      'Step 1 · Applicant approved',
      'Step 2 · Team lead sent to lead@agency.gov.sg',
    ])
  })
  it('does not invent recipients, notification details, actors or a workflow-completed event', () => {
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          submittedSteps: [
            { isApproval: false, submittedAt: at },
            { isApproval: false, submittedAt: at },
            {
              isApproval: false,
              submittedAt: at,
              nextStepRecipientEmails: ['unused@agency.gov.sg'],
            },
          ],
          workflowEvents: [
            { ...event(WorkflowEventType.Stopped, at, []), actorEmail: '' },
          ],
        }}
      />,
    )
    expect(titles()).toEqual([
      'Step 1 submitted',
      'Step 2 · Team lead submitted',
      'Step 3 submitted',
      'Workflow stopped',
    ])
    expect(
      screen.queryByText('Notification recipients'),
    ).not.toBeInTheDocument()
  })
  it('does not manufacture sending entries for a reminder without recipients', () => {
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          submittedSteps: [],
          workflowEvents: [event(WorkflowEventType.ReminderSent, at, [])],
        }}
      />,
    )
    expect(titles()).toEqual([
      'Reminder triggered for Step 2 · Team lead by admin@agency.gov.sg',
    ])
  })
  it('has no invented submission for empty history', () => {
    render(<WorkflowActivityLog />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  describe('with step submitted events', () => {
    it('lists each step once, from its event, with the recipients it recorded', () => {
      render(
        <WorkflowActivityLog
          history={{
            ...history,
            submittedSteps: twoSubmittedSteps,
            workflowEvents: [
              stepSubmitted(1, at, ['lead@agency.gov.sg']),
              stepSubmitted(
                2,
                '2026-10-08T02:00:00.000Z',
                ['hr@agency.gov.sg'],
                WorkflowStatus.APPROVED,
              ),
            ],
          }}
        />,
      )
      expect(titles()).toEqual([
        'Step 1 submitted',
        'Step 2 · Team lead sent to lead@agency.gov.sg',
        'Step 2 · Team lead approved',
        'Step 3 sent to hr@agency.gov.sg',
      ])
    })

    it('orders backfilled events by when the step was submitted, not when they were stored', () => {
      render(
        <WorkflowActivityLog
          history={{
            ...history,
            submittedSteps: twoSubmittedSteps,
            workflowEvents: [
              event(
                WorkflowEventType.ReminderSent,
                '2026-10-08T01:30:00.000Z',
                ['lead@agency.gov.sg'],
              ),
              stepSubmitted(1, at, ['lead@agency.gov.sg']),
              stepSubmitted(
                2,
                '2026-10-08T02:00:00.000Z',
                ['hr@agency.gov.sg'],
                WorkflowStatus.APPROVED,
              ),
            ],
          }}
        />,
      )
      expect(titles()).toEqual([
        'Step 1 submitted',
        'Step 2 · Team lead sent to lead@agency.gov.sg',
        'Reminder triggered for Step 2 · Team lead by admin@agency.gov.sg',
        'Reminder for Step 2 · Team lead sent to lead@agency.gov.sg',
        'Step 2 · Team lead approved',
        'Step 3 sent to hr@agency.gov.sg',
      ])
    })

    it('falls back to submittedSteps for steps without an event', () => {
      render(
        <WorkflowActivityLog
          history={{
            ...history,
            submittedSteps: twoSubmittedSteps,
            workflowEvents: [
              stepSubmitted(
                2,
                '2026-10-08T02:00:00.000Z',
                ['hr@agency.gov.sg'],
                WorkflowStatus.APPROVED,
              ),
            ],
          }}
        />,
      )
      expect(titles()).toEqual([
        'Step 1 submitted',
        'Step 2 · Team lead sent to lead@agency.gov.sg',
        'Step 2 · Team lead approved',
        'Step 3 sent to hr@agency.gov.sg',
      ])
    })

    it('lists a step before an admin action at the same moment', () => {
      render(
        <WorkflowActivityLog
          history={{
            ...history,
            workflowEvents: [
              event(WorkflowEventType.AssigneesAdded, at, [
                'new@agency.gov.sg',
              ]),
              stepSubmitted(1, at, ['lead@agency.gov.sg']),
            ],
          }}
        />,
      )
      expect(titles()).toEqual([
        'Step 1 submitted',
        'Step 2 · Team lead sent to lead@agency.gov.sg',
        'new@agency.gov.sg added to Step 2 · Team lead by admin@agency.gov.sg',
      ])
    })

    it('sends nothing on after a rejected step', () => {
      render(
        <WorkflowActivityLog
          history={{
            ...history,
            submittedSteps: twoSubmittedSteps,
            workflowEvents: [
              stepSubmitted(1, at, ['lead@agency.gov.sg']),
              stepSubmitted(
                2,
                '2026-10-08T02:00:00.000Z',
                [],
                WorkflowStatus.REJECTED,
              ),
            ],
          }}
        />,
      )
      expect(titles()).toEqual([
        'Step 1 submitted',
        'Step 2 · Team lead sent to lead@agency.gov.sg',
        'Step 2 · Team lead rejected',
      ])
    })
  })

  it('skips events of a type it does not know', () => {
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          workflowEvents: [
            {
              ...event(WorkflowEventType.Stopped, at, []),
              type: 'not_a_known_event',
            } as unknown as AdminWorkflowEventDto,
          ],
        }}
      />,
    )
    expect(titles()).toEqual([
      'Step 1 submitted',
      'Step 2 · Team lead sent to lead@agency.gov.sg',
    ])
  })

  it('lists a send back between the undone steps and their resubmission', () => {
    const sentBack: AdminWorkflowEventDto = {
      type: WorkflowEventType.SentBack,
      actorEmail: 'admin@agency.gov.sg',
      stepNumber: 2,
      fromStepNumber: 4,
      emails: ['lead@agency.gov.sg'],
      remarks: 'Fix the <b>dates</b>',
      created: '2026-10-08T04:00:00.000Z' as DateString,
    }
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          submittedSteps: twoSubmittedSteps.map((step, index) =>
            index === 1
              ? { ...step, submittedAt: '2026-10-08T05:00:00.000Z' }
              : step,
          ),
          workflowEvents: [
            stepSubmitted(1, at, ['lead@agency.gov.sg']),
            stepSubmitted(
              2,
              '2026-10-08T02:00:00.000Z',
              ['hr@agency.gov.sg'],
              WorkflowStatus.APPROVED,
            ),
            stepSubmitted(3, '2026-10-08T03:00:00.000Z', []),
            sentBack,
            stepSubmitted(
              2,
              '2026-10-08T05:00:00.000Z',
              ['hr@agency.gov.sg'],
              WorkflowStatus.APPROVED,
            ),
          ],
        }}
      />,
    )
    expect(titles()).toEqual([
      'Step 1 submitted',
      'Step 2 · Team lead sent to lead@agency.gov.sg',
      'Step 2 · Team lead approved',
      'Step 3 sent to hr@agency.gov.sg',
      'Step 3 submitted',
      'Sent back from Step 4 to Step 2 · Team lead by admin@agency.gov.sg',
      'Step 2 · Team lead sent to lead@agency.gov.sg',
      'Step 2 · Team lead approved',
      'Step 3 sent to hr@agency.gov.sg',
    ])
    const sendBackItem = screen.getAllByRole('listitem')[5]
    expect(within(sendBackItem).getByText('Remarks')).toBeInTheDocument()
    expect(
      within(sendBackItem).getByText('Fix the <b>dates</b>'),
    ).toBeInTheDocument()
  })
})
