import { QueryClient, QueryClientProvider } from 'react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import {
  AdminMultirespondentFormDto,
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  MultirespondentFormSettings,
  MyInfoAttribute,
  WorkflowType,
} from 'formsg-shared/types'

import { StepAuthSettingsEditor } from './StepAuthSettingsEditor'

const requests = vi.hoisted(() => ({
  update: vi.fn(),
  form: vi.fn(),
  single: vi.fn(),
  whitelist: vi.fn(),
}))
vi.mock('~features/admin-form/common/AdminViewFormService', () => ({
  getAdminFormView: requests.form,
}))
vi.mock('~features/admin-form/create/workflow/FormWorkflowService', () => ({
  updateWorkflowStep: requests.update,
}))
vi.mock('../../SettingsService', () => ({
  updateIsSingleSubmission: requests.single,
  updateFormWhitelistSetting: requests.whitelist,
}))
vi.mock('./SecretKeyDownloadWhitelistFileModal', () => ({
  SecretKeyDownloadWhitelistFileModal: () => null,
}))
vi.mock('./StepLoginControls', () => ({
  hasEsrvcIdWhitespace: (value: string) => /\s/.test(value),
  StepLoginControls: ({
    authType,
    onAuthTypeChange,
    onEsrvcIdChange,
  }: {
    authType: FormAuthType
    onAuthTypeChange: (type: FormAuthType) => void
    onEsrvcIdChange: (id: string) => void
  }) => (
    <>
      <span data-testid="provider">{authType}</span>
      <button onClick={() => onAuthTypeChange(FormAuthType.CP)}>
        Use Corppass
      </button>
      <button onClick={() => onAuthTypeChange(FormAuthType.MyInfo)}>
        Use Singpass
      </button>
      <button onClick={() => onAuthTypeChange(FormAuthType.NIL)}>
        Turn off authentication
      </button>
      <input
        aria-label="E-service ID"
        onChange={(e) => onEsrvcIdChange(e.target.value)}
      />
    </>
  ),
}))

const settings = {
  authType: FormAuthType.MyInfo,
  esrvcId: '',
  isSingleSubmission: false,
  responseMode: FormResponseMode.Multirespondent,
  status: FormStatus.Private,
} as MultirespondentFormSettings
const steps = [
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
    emails: ['approver@example.gov.sg'],
    step_name: 'Approver',
  },
]
const form = {
  ...settings,
  workflow: steps,
  form_fields: [],
} as unknown as AdminMultirespondentFormDto
const setup = (stepIndex = 1, currentForm = form) => {
  const onClose = vi.fn()
  const onDirtyChange = vi.fn()
  const onSavingChange = vi.fn()
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    // React Query v3 still declares its provider with React 17 children types.
    // @ts-expect-error React 18 children are supported at runtime.
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/form']}>
        <Routes>
          <Route
            path="/:formId"
            element={
              <StepAuthSettingsEditor
                form={currentForm}
                settings={settings}
                step={currentForm.workflow[stepIndex]}
                stepIndex={stepIndex}
                onClose={onClose}
                onDirtyChange={onDirtyChange}
                onSavingChange={onSavingChange}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { onClose, onDirtyChange }
}

describe('step authentication drafts', () => {
  beforeEach(() => {
    requests.form.mockReset().mockResolvedValue(form)
    requests.update.mockReset().mockResolvedValue(steps)
    requests.single.mockReset().mockResolvedValue(settings)
    requests.whitelist.mockReset().mockResolvedValue(settings)
  })

  it('does not save provider changes until Save, and Cancel does not call the server', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Use Corppass' }))
    expect(requests.update).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(requests.update).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('saves the provider and e-service ID together without changing respondents or fields', async () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Use Corppass' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'E-service ID' }), {
      target: { value: 'agency-service' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(requests.update).toHaveBeenCalledWith('form', 1, {
      ...steps[1],
      auth: { auth_type: FormAuthType.CP, esrvc_id: 'agency-service' },
    })
    expect(requests.single).not.toHaveBeenCalled()
    expect(requests.whitelist).not.toHaveBeenCalled()
  })

  it('leaves the card open and reports a failed save', async () => {
    requests.update.mockRejectedValue(new Error('Save failed'))
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Use Corppass' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('refuses to overwrite a step changed after the card was opened', async () => {
    requests.form.mockResolvedValue({
      ...form,
      workflow: [
        steps[0],
        { ...steps[1], step_name: 'Renamed by collaborator' },
      ],
    })
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Use Corppass' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This step has changed since you opened it.',
    )
    expect(requests.update).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('stages Step 1 restrictions, then reports a partial save if their endpoint fails', async () => {
    requests.single.mockRejectedValue(new Error('Restriction failed'))
    const { onClose } = setup(0)
    fireEvent.click(screen.getByRole('checkbox', { name: /Limit each unique/ }))
    expect(requests.single).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The login was saved, but some Step 1 restrictions could not be saved.',
    )
    expect(requests.single).toHaveBeenCalledWith('form', true)
    expect(onClose).not.toHaveBeenCalled()
  })

  const formWithCorppassFields = () =>
    ({
      ...form,
      form_fields: [
        {
          _id: 'uen',
          title: 'Organisation UEN',
          fieldType: BasicField.Uen,
          corppass: { attr: CorppassAttribute.Uen },
        },
        { _id: 'plain', title: 'Comments', fieldType: BasicField.ShortText },
      ],
      workflow: [
        steps[0],
        {
          ...steps[1],
          edit: ['uen', 'plain'],
          auth: { auth_type: FormAuthType.CP },
          approval_field: 'approval',
          is_approval_enabled: true,
        },
      ],
    }) as unknown as AdminMultirespondentFormDto

  it('confirms incompatible fields, preserves them on cancel, then stages unassignment with the new provider', async () => {
    const current = formWithCorppassFields()
    requests.form.mockResolvedValue(current)
    const { onClose } = setup(1, current)
    fireEvent.click(screen.getByRole('button', { name: 'Use Singpass' }))
    let dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Organisation UEN')).toBeInTheDocument()
    expect(within(dialog).getByText(/kept in your form/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByTestId('provider')).toHaveTextContent(FormAuthType.CP)
    expect(requests.update).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Use Singpass' }))
    dialog = screen.getByRole('dialog')
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Unassign fields and switch to Singpass',
      }),
    )
    expect(requests.update).not.toHaveBeenCalled()
    expect(screen.getByTestId('provider')).toHaveTextContent(
      FormAuthType.MyInfo,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(requests.update).toHaveBeenCalledWith('form', 1, {
      ...current.workflow[1],
      edit: ['plain'],
      auth: { auth_type: FormAuthType.MyInfo },
    })
    expect(current.form_fields.map((field) => field._id)).toEqual([
      'uen',
      'plain',
    ])
  })

  it('can turn off the last Corppass step and discard the unassignment with Cancel', async () => {
    const current = formWithCorppassFields()
    const { onClose } = setup(1, current)
    fireEvent.click(
      screen.getByRole('button', { name: 'Turn off authentication' }),
    )
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Unassign fields and turn off',
      }),
    )
    expect(screen.getByTestId('provider')).toHaveTextContent(FormAuthType.NIL)
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(requests.update).not.toHaveBeenCalled()
    expect(current.workflow[1].edit).toEqual(['uen', 'plain'])
  })

  it('saves Step 1 authentication and its confirmed field unassignment in one step request', async () => {
    const current = {
      ...form,
      form_fields: [
        {
          _id: 'name',
          title: 'Verified name',
          fieldType: BasicField.ShortText,
          myInfo: { attr: MyInfoAttribute.Name },
        },
      ],
      workflow: [{ ...steps[0], edit: ['name'] }, steps[1]],
    } as unknown as AdminMultirespondentFormDto
    requests.form.mockResolvedValue(current)
    const { onClose } = setup(0, current)
    fireEvent.click(screen.getByRole('button', { name: 'Use Corppass' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Unassign fields and switch to Corppass',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(requests.update).toHaveBeenCalledWith(
      'form',
      0,
      expect.objectContaining({
        edit: [],
        first_step_login: { auth_type: FormAuthType.CP, esrvc_id: '' },
      }),
    )
  })
})
