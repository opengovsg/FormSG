import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormSettings,
  WorkflowType,
} from 'formsg-shared/types'

import { StepLoginAccordion } from './StepLoginAccordion'

vi.mock(
  '~features/admin-form/create/workflow/hooks/useWorkflowSurfaces',
  () => ({
    useWorkflowSurfaces: () => ({
      cardRadius: '8px',
      activeCardBg: 'primary.50',
    }),
  }),
)
vi.mock(
  '~features/admin-form/create/workflow/components/WorkflowContent/StepLabel',
  () => ({
    StepLabel: ({
      stepNumber,
      stepName,
    }: {
      stepNumber: number
      stepName: string
    }) => (
      <span>
        {stepNumber + 1} {stepName}
      </span>
    ),
  }),
)
const save = vi.fn(async () => true)

vi.mock('./StepAuthSettingsEditor', () => ({
  StepAuthSettingsEditor: ({
    stepIndex,
    onClose,
    onDirtyChange,
    onSaveReady,
  }: {
    stepIndex: number
    onClose: () => void
    onDirtyChange: (value: boolean) => void
    onSaveReady: (save: (() => Promise<boolean>) | null) => void
  }) => {
    useEffect(() => {
      onSaveReady(save)
      return () => onSaveReady(null)
    }, [onSaveReady])
    return (
      <div data-testid={`editor-${stepIndex}`}>
        <button onClick={() => onDirtyChange(true)}>Change login</button>
        <button onClick={onClose}>Cancel editor</button>
      </div>
    )
  },
}))

const settings = { authType: FormAuthType.MyInfo } as FormSettings
const form = {
  workflow: [
    {
      _id: 'one',
      workflow_type: WorkflowType.Static,
      edit: [],
      emails: [],
      step_name: 'Requester',
    },
    {
      _id: 'two',
      workflow_type: WorkflowType.Static,
      edit: [],
      emails: [],
      step_name: 'Approver',
      auth: { auth_type: FormAuthType.CP },
    },
    {
      _id: 'three',
      workflow_type: WorkflowType.Static,
      edit: [],
      emails: [],
      step_name: 'Processing officer',
    },
  ],
} as unknown as AdminMultirespondentFormDto

const setup = () =>
  render(
    <MemoryRouter>
      <StepLoginAccordion form={form} settings={settings} />
    </MemoryRouter>,
  )

describe('workflow-shaped authentication settings', () => {
  beforeEach(() => save.mockClear())
  it('starts collapsed, shows all provider states, and connects the cards with arrows', () => {
    setup()
    expect(screen.queryByTestId('editor-0')).not.toBeInTheDocument()
    expect(screen.getByText('Singpass')).toBeInTheDocument()
    expect(screen.getByText('Corppass')).toBeInTheDocument()
    expect(
      screen.getByText('Singpass authentication not enabled'),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('settings-step-connector')).toHaveLength(2)
    expect(
      screen.getByRole('button', { name: /Edit your full workflow/ }),
    ).toBeInTheDocument()
  })

  it('opens one card at a time and cancelling collapses it', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /1 Requester/ }))
    await screen.findByTestId('editor-0')
    fireEvent.click(screen.getByRole('button', { name: /2 Approver/ }))
    await screen.findByTestId('editor-1')
    expect(screen.queryByTestId('editor-0')).not.toBeInTheDocument()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancel editor' }),
    )
    expect(screen.queryByTestId('editor-1')).not.toBeInTheDocument()
  })

  it('saves before switching edited cards and keeps the current card on failure', async () => {
    save.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    setup()
    fireEvent.click(screen.getByRole('button', { name: /1 Requester/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Change login' }))
    fireEvent.click(screen.getByRole('button', { name: /2 Approver/ }))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(screen.getByTestId('editor-0')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /2 Approver/ }))
    await screen.findByTestId('editor-1')
    expect(screen.queryByTestId('editor-0')).not.toBeInTheDocument()
  })
})
