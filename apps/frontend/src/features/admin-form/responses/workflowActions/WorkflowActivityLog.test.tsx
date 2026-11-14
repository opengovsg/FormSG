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
  it('groups each action and its recipients, oldest first, including timestamp ties', () => {
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
      'Assignee added to Step 2 (Team lead)',
      'Reminder requested for Step 2 (Team lead)',
      'Response voided',
    ])
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(within(items[0]).getByText('lead@agency.gov.sg')).toBeInTheDocument()
    expect(within(items[0]).queryByText('(Form admin)')).not.toBeInTheDocument()
    expect(
      within(items[2]).getByText('Reminder recipients'),
    ).toBeInTheDocument()
    expect(within(items[2]).getByText('new@agency.gov.sg')).toBeInTheDocument()
    expect(within(items[2]).getByText('(Form admin)')).toBeInTheDocument()
    expect(
      within(items[2]).getByText('admin@agency.gov.sg'),
    ).toBeInTheDocument()
    expect(
      within(items[0]).getByText('Thu, 8 Oct 2026, 09:00:00 AM'),
    ).toBeInTheDocument()
    expect(
      within(items[1]).getByText('Thu, 8 Oct 2026, 09:00:00 AM'),
    ).toBeInTheDocument()
    expect(
      within(items[3]).getByText('Notification recipients'),
    ).toBeInTheDocument()
    expect(
      within(items[3]).getByText('notify@agency.gov.sg'),
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
      'Step 2 (Team lead) rejected',
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
    expect(titles()).toEqual(['Step 1 (Applicant) approved'])
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
      'Step 2 (Team lead) submitted',
      'Step 3 submitted',
      'Response voided',
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
    expect(titles()).toEqual(['Reminder requested for Step 2 (Team lead)'])
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
        'Step 2 (Team lead) approved',
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
        'Reminder requested for Step 2 (Team lead)',
        'Step 2 (Team lead) approved',
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
        'Step 2 (Team lead) approved',
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
        'Assignee added to Step 2 (Team lead)',
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
        'Step 2 (Team lead) rejected',
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
    expect(titles()).toEqual(['Step 1 submitted'])
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
      'Step 2 (Team lead) approved',
      'Step 3 submitted',
      'Sent back (require full review)',
      'Step 2 (Team lead) approved',
    ])
    const sendBackItem = screen.getAllByRole('listitem')[3]
    expect(within(sendBackItem).getByText('Remarks')).toBeInTheDocument()
    expect(
      within(sendBackItem).getByText('Fix the <b>dates</b>'),
    ).toBeInTheDocument()
  })
})

describe('grouped activity details', () => {
  it('shows fix recipients and remarks in the same entry without explanations', () => {
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          submittedSteps: [],
          workflowEvents: [
            {
              ...event(WorkflowEventType.FixStep, at, ['lead@agency.gov.sg']),
              fromStepNumber: 4,
              remarks: 'Please check\nthe amount.',
            },
          ],
        }}
      />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(
      within(items[0]).getByRole('heading', { level: 3 }),
    ).toHaveTextContent('Sent back (review not needed)')
    expect(
      within(items[0]).getByText(
        'Sent back to Step 2 (Team lead) · Assigned to',
      ),
    ).toBeInTheDocument()
    expect(within(items[0]).getByText('lead@agency.gov.sg')).toBeInTheDocument()
    expect(within(items[0]).getByText('Remarks')).toBeInTheDocument()
    expect(within(items[0]).getByText(/Please check/)).toHaveTextContent(
      'Please check the amount.',
    )
    expect(screen.queryByText(/Returns to|Later steps/)).not.toBeInTheDocument()
  })
  it('keeps distinct repeated submissions with identical timestamps', () => {
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          submittedSteps: [],
          workflowEvents: [
            stepSubmitted(1, at, ['one@agency.gov.sg']),
            stepSubmitted(1, at, ['two@agency.gov.sg']),
          ],
        }}
      />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('one@agency.gov.sg')).toBeInTheDocument()
    expect(within(items[1]).getByText('two@agency.gov.sg')).toBeInTheDocument()
  })
  it('renders the current state after historical entries', () => {
    render(
      <WorkflowActivityLog
        history={history}
        currentState={<li>Current step: Step 2</li>}
      />,
    )
    expect(screen.getAllByRole('listitem').at(-1)).toHaveTextContent(
      'Current step: Step 2',
    )
  })
  it('omits unavailable metadata, separators, and empty recipient boxes', () => {
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          submittedSteps: [],
          workflowEvents: [
            {
              ...event(WorkflowEventType.ReminderSent, at, []),
              actorEmail: '',
            },
          ],
        }}
      />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.queryByText('(Form admin)')).not.toBeInTheDocument()
    expect(screen.queryByText('·')).not.toBeInTheDocument()
    expect(screen.queryByText('Reminder recipients')).not.toBeInTheDocument()
    expect(screen.queryByText(/Singpass|Corppass/)).not.toBeInTheDocument()
  })
})
