import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  DateString,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import { render } from '~/test-utils'

import { SendBackModal } from './SendBackModal'

const I18N =
  'features.adminForm.responses.individualResponse.workflowActions.sendBackModal'
const CONFIRM = `${I18N}.confirm`

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      key.endsWith('stepNumber')
        ? `Step ${values?.stepNumber}`
        : key.endsWith('stepNameLabel')
          ? ` (${values?.name})`
          : key,
  }),
}))

// The dropdown's virtualised menu renders no options in jsdom, so a native
// select stands in for it.
vi.mock('~components/Dropdown', async (importOriginal) => ({
  ...(await importOriginal<object>()),
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
      onChange={(e) => onChange(e.target.value)}
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

// Step 4 is pending.
const history = {
  submittedSteps: [
    step(['lead@agency.gov.sg', 'deputy@agency.gov.sg']),
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
  workflowEvents: [
    {
      type: WorkflowEventType.AssigneesAdded as const,
      actorEmail: 'admin@agency.gov.sg',
      stepNumber: 2,
      emails: ['deputy@agency.gov.sg'],
      created: '2026-10-08T01:30:00.000Z' as DateString,
    },
  ],
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
  it('offers steps 2 to the one before the pending step', () => {
    showModal()

    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['Step 2 (Team lead)', 'Step 3'])
  })

  it('defaults to the step before the pending one and lists its people', () => {
    const onConfirm = showModal()

    expect(screen.getByRole('combobox', { name: 'step' })).toHaveValue('3')
    expect(screen.getByText('hr@agency.gov.sg')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: CONFIRM }))
    expect(onConfirm).toHaveBeenCalledWith({
      targetStepNumber: 3,
      remarks: '',
    })
  })

  it("sends back to the chosen step with remarks, notifying that step's people", async () => {
    const onConfirm = showModal()

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'step' }),
      'Step 2 (Team lead)',
    )
    await userEvent.type(
      screen.getByRole('textbox', { name: /remarks/i }),
      'Fix the dates',
    )

    expect(
      screen.getByText('lead@agency.gov.sg and deputy@agency.gov.sg'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: CONFIRM }))
    expect(onConfirm).toHaveBeenCalledWith({
      targetStepNumber: 2,
      remarks: 'Fix the dates',
    })
  })

  it('rejects remarks over 1000 characters', () => {
    const onConfirm = showModal()

    fireEvent.change(screen.getByRole('textbox', { name: /remarks/i }), {
      target: { value: 'a'.repeat(1001) },
    })

    expect(screen.getByText(`${I18N}.remarksTooLong`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: CONFIRM })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: CONFIRM }))
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
