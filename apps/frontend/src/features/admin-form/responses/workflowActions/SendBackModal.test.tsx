import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AdminWorkflowEventDto,
  DateString,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import { render } from '~/test-utils'

import { SendBackModal } from './SendBackModal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values: Record<string, unknown> = {}) => {
      if (key.endsWith('activityLog.stepNumber'))
        return `Step ${values.stepNumber}`
      if (key.endsWith('activityLog.stepNameLabel')) return ` · ${values.name}`
      if (key.endsWith('remarksTooLong')) return `Too long, max ${values.max}`
      return key.split('.').pop()
    },
  }),
}))

vi.mock('~components/Dropdown', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~components/Dropdown')>()),
  SingleSelect: ({
    value,
    onChange,
    items,
  }: {
    value: string
    onChange: (value: string) => void
    items: { value: string; label: string }[]
  }) => (
    <select
      aria-label="step"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  ),
}))

const step = (recipients: string[]) => ({
  isApproval: false as const,
  submittedAt: '2026-10-08T01:00:00.000Z',
  nextStepRecipientEmails: recipients,
})

const added: AdminWorkflowEventDto = {
  type: WorkflowEventType.AssigneesAdded,
  actorEmail: 'admin@agency.gov.sg',
  stepNumber: 2,
  emails: ['deputy@agency.gov.sg'],
  created: '2026-10-08T01:30:00.000Z' as DateString,
}

const history = {
  submittedSteps: [
    step(['lead@agency.gov.sg']),
    {
      isApproval: true as const,
      status: WorkflowStatus.APPROVED as const,
      submittedAt: '2026-10-08T02:00:00.000Z',
      nextStepRecipientEmails: ['hr@agency.gov.sg'],
    },
    step(['finance@agency.gov.sg']),
  ],
  workflow: [
    { _id: 'step-1', step_name: 'Applicant' },
    { _id: 'step-2', step_name: 'Team lead' },
    { _id: 'step-3' },
    { _id: 'step-4', step_name: 'Finance' },
  ],
  workflowEvents: [added],
}

const showModal = (onConfirm = vi.fn()) => {
  render(
    <SendBackModal
      isOpen
      onClose={vi.fn()}
      onConfirm={onConfirm}
      history={history}
    />,
  )
  return onConfirm
}

describe('SendBackModal', () => {
  it('offers steps 2 to the one before the pending step, defaulting to the latest', () => {
    showModal()

    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['Step 2 · Team lead', 'Step 3'])
    expect(screen.getByRole('combobox', { name: 'step' })).toHaveValue('3')
  })

  it("shows the chosen step's people, including those added to it", async () => {
    showModal()

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'step' }),
      '2',
    )

    expect(
      screen.getByText('lead@agency.gov.sg and deputy@agency.gov.sg'),
    ).toBeInTheDocument()
  })

  it('sends back to the chosen step with trimmed remarks', async () => {
    const onConfirm = showModal()

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'step' }),
      '2',
    )
    await userEvent.type(screen.getByRole('textbox'), '  Fix the dates  ')
    await userEvent.click(screen.getByRole('button', { name: 'confirm' }))

    expect(onConfirm).toHaveBeenCalledWith({
      targetStepNumber: 2,
      remarks: 'Fix the dates',
    })
  })

  it('sends no remarks when the field is blank', async () => {
    const onConfirm = showModal()

    await userEvent.click(screen.getByRole('button', { name: 'confirm' }))

    expect(onConfirm).toHaveBeenCalledWith({
      targetStepNumber: 3,
      remarks: undefined,
    })
  })

  it('blocks remarks over the limit', async () => {
    showModal()

    await userEvent.click(screen.getByRole('textbox'))
    await userEvent.paste('x'.repeat(1001))

    expect(screen.getByText('Too long, max 1000')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'confirm' })).toBeDisabled()
  })
})
