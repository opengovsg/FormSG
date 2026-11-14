import { screen, within } from '@testing-library/react'
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
      if (key.endsWith('recipientsLabel')) return `People in ${values.stepName}`
      if (key.endsWith('remarksTooLong')) return `Too long, max ${values.max}`
      return key.split('.').pop()
    },
  }),
}))

vi.mock('~components/Dropdown', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~components/Dropdown')>()),
  SingleSelect: ({
    name,
    value,
    onChange,
    items,
  }: {
    name: string
    value: string
    onChange: (value: string) => void
    items: { value: string; label: string }[]
  }) => (
    <select
      aria-label={name}
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
  it('keeps the step and remarks when switching modes and sends the selected mode', async () => {
    const onConfirm = showModal()
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'sendBackStep' }),
      '2',
    )
    await userEvent.type(screen.getByRole('textbox'), 'Fix dates')
    await userEvent.click(screen.getByRole('tab', { name: 'reviewNotNeeded' }))
    expect(screen.getByRole('combobox', { name: 'sendBackStep' })).toHaveValue(
      '2',
    )
    expect(screen.getByRole('textbox')).toHaveValue('Fix dates')
    expect(
      screen.getByRole('combobox', { name: 'sendBackKeepFilled' }),
    ).toBeInTheDocument()
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'sendBackKeepFilled' }),
      'clear',
    )
    await userEvent.click(screen.getByRole('button', { name: 'confirm' }))
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        targetStepNumber: 2,
        remarks: 'Fix dates',
        clearResponses: true,
      }),
      'fixStep',
    )
  })

  it('offers steps 2 to the one before the pending step, defaulting to the latest', () => {
    showModal()

    expect(
      within(screen.getByRole('combobox', { name: 'sendBackStep' }))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Step 2 · Team lead', 'Step 3'])
    expect(screen.getByRole('combobox', { name: 'sendBackStep' })).toHaveValue(
      '3',
    )
    expect(screen.getByText('People in Step 3')).toBeInTheDocument()
  })

  it("shows the chosen step's people, including those added to it", async () => {
    showModal()

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'sendBackStep' }),
      '2',
    )

    expect(screen.getByText('People in Step 2 · Team lead')).toBeInTheDocument()
    const lead = screen.getByText('lead@agency.gov.sg')
    const deputy = screen.getByText('deputy@agency.gov.sg')
    expect(
      lead.compareDocumentPosition(deputy) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      deputy.compareDocumentPosition(screen.getByRole('textbox')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.queryByText('whoIsNotifiedLabel')).not.toBeInTheDocument()
    expect(screen.queryByText('hr@agency.gov.sg')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Remove selected option' }),
    ).not.toBeInTheDocument()
  })

  it('explains when the selected step has no recipients', () => {
    render(
      <SendBackModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        history={{
          ...history,
          submittedSteps: [step([]), step([]), step([])],
          workflowEvents: [],
        }}
      />,
    )

    expect(screen.getByText('People in Step 3')).toBeInTheDocument()
    expect(screen.getByText('whoIsNotifiedNone')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'confirm' })).toBeEnabled()
  })

  it('sends back to the chosen step with trimmed remarks', async () => {
    const onConfirm = showModal()

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'sendBackStep' }),
      '2',
    )
    await userEvent.type(screen.getByRole('textbox'), '  Fix the dates  ')
    await userEvent.click(screen.getByRole('button', { name: 'confirm' }))

    expect(onConfirm).toHaveBeenCalledWith(
      {
        targetStepNumber: 2,
        remarks: 'Fix the dates',
        clearResponses: false,
      },
      'sendBack',
    )
  })

  it('sends no remarks when the field is blank', async () => {
    const onConfirm = showModal()

    await userEvent.click(screen.getByRole('button', { name: 'confirm' }))

    expect(onConfirm).toHaveBeenCalledWith(
      {
        targetStepNumber: 3,
        remarks: undefined,
        clearResponses: false,
      },
      'sendBack',
    )
  })

  it('keeps form fields filled unless told to clear them', async () => {
    const onConfirm = showModal()

    expect(
      screen.getByRole('combobox', { name: 'sendBackKeepFilled' }),
    ).toHaveDisplayValue('keepFilledYes')
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'sendBackKeepFilled' }),
      'clear',
    )
    await userEvent.click(screen.getByRole('button', { name: 'confirm' }))

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ clearResponses: true }),
      'sendBack',
    )
  })

  it('blocks remarks over the limit', async () => {
    showModal()

    await userEvent.click(screen.getByRole('textbox'))
    await userEvent.paste('x'.repeat(1001))

    expect(screen.getByText('Too long, max 1000')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'confirm' })).toBeDisabled()
  })

  describe('to step 1', () => {
    const showStepOneModal = (onConfirm = vi.fn()) => {
      render(
        <SendBackModal
          isOpen
          onClose={vi.fn()}
          onConfirm={onConfirm}
          history={history}
          canSendBackToStepOne
        />,
      )
      return onConfirm
    }

    it('offers step 1 only on forms that allow it', () => {
      showStepOneModal()

      expect(
        within(screen.getByRole('combobox', { name: 'sendBackStep' }))
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['Step 1 · Applicant', 'Step 2 · Team lead', 'Step 3'])
    })

    it('asks for an email and sends step 1 to it', async () => {
      const onConfirm = showStepOneModal()

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'sendBackStep' }),
        '1',
      )
      expect(screen.getByRole('button', { name: 'confirm' })).toBeDisabled()
      await userEvent.type(
        screen.getByPlaceholderText('me@example.com'),
        'Applicant@Agency.gov.sg',
      )

      expect(screen.queryByText(/^People in /)).not.toBeInTheDocument()
      expect(screen.queryByText('whoIsNotifiedLabel')).not.toBeInTheDocument()
      expect(
        screen.queryByText('applicant@agency.gov.sg'),
      ).not.toBeInTheDocument()
      expect(screen.getByText('stepOneEmailDescription')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'confirm' }))
      expect(onConfirm).toHaveBeenCalledWith(
        {
          targetStepNumber: 1,
          remarks: undefined,
          clearResponses: false,
          stepOneRecipientEmail: 'applicant@agency.gov.sg',
        },
        'sendBack',
      )
    })

    it('shows invalid-email feedback after first blur then updates while editing', async () => {
      const onConfirm = showStepOneModal()
      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'sendBackStep' }),
        '1',
      )
      const email = screen.getByPlaceholderText('me@example.com')
      const confirm = screen.getByRole('button', { name: 'confirm' })
      expect(screen.queryByText('invalidEmail')).not.toBeInTheDocument()
      expect(email).not.toHaveAttribute('aria-invalid', 'true')
      expect(confirm).toBeDisabled()

      await userEvent.type(email, 'sufy')
      expect(email).toHaveFocus()
      expect(screen.queryByText('invalidEmail')).not.toBeInTheDocument()
      expect(email).not.toHaveAttribute('aria-invalid', 'true')
      expect(confirm).toBeDisabled()

      await userEvent.tab()
      expect(screen.getByText('invalidEmail')).toBeInTheDocument()
      expect(email).toHaveAttribute('aria-invalid', 'true')
      expect(confirm).toBeDisabled()

      await userEvent.click(email)
      expect(screen.getByText('invalidEmail')).toBeInTheDocument()
      expect(email).toHaveAttribute('aria-invalid', 'true')
      expect(confirm).toBeDisabled()

      await userEvent.type(email, '@agency.gov.sg')
      expect(screen.queryByText('invalidEmail')).not.toBeInTheDocument()
      expect(email).not.toHaveAttribute('aria-invalid', 'true')
      expect(confirm).toBeEnabled()
      await userEvent.tab()
      expect(screen.queryByText('invalidEmail')).not.toBeInTheDocument()
      expect(email).not.toHaveAttribute('aria-invalid', 'true')
      expect(confirm).toBeEnabled()
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })
})

describe('SendBackModal reset', () => {
  it('resets mode and input after closing and reopening', async () => {
    const props = { onClose: vi.fn(), onConfirm: vi.fn(), history }
    const { rerender } = render(<SendBackModal {...props} isOpen />)
    await userEvent.type(screen.getByRole('textbox'), 'Temporary note')
    await userEvent.click(screen.getByRole('tab', { name: 'reviewNotNeeded' }))
    rerender(<SendBackModal {...props} isOpen={false} />)
    rerender(<SendBackModal {...props} isOpen />)
    expect(
      screen.getByRole('tab', { name: 'requireFullReview' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('textbox')).toHaveValue('')
  })
})
