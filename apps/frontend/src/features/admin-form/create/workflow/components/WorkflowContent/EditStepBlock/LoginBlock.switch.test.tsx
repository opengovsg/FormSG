import { useForm } from 'react-hook-form'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormStatus,
  WorkflowType,
} from 'formsg-shared/types'

import { EditStepInputs } from '../../../types'

import { LoginBlock } from './LoginBlock'

const fields = [
  {
    _id: 'uen',
    title: 'Organisation UEN',
    fieldType: BasicField.Uen,
    corppass: { attr: CorppassAttribute.Uen },
  },
  { _id: 'plain', title: 'Comments', fieldType: BasicField.ShortText },
]
const state = vi.hoisted(() => ({ status: 'PRIVATE' }))
vi.mock('~features/admin-form/common/queries', () => ({
  useAdminForm: () => ({
    data: { authType: FormAuthType.MyInfo, status: state.status },
  }),
}))
vi.mock('~features/admin-form/settings/queries', () => ({
  useAdminFormSettings: () => ({ data: undefined }),
}))
vi.mock('../../../hooks/useAdminFormWorkflow', () => ({
  useAdminFormWorkflow: () => ({ formFields: fields }),
}))
vi.mock('../../../hooks/useIsWorkflowBuilderRedesign', () => ({
  useIsWorkflowBuilderRedesign: () => true,
}))
vi.mock('../../Spotlight', () => ({ useIsSpotlightActiveSection: () => false }))
vi.mock('./EditStepBlock', () => ({ FIELDS_TO_EDIT_NAME: 'edit' }))
vi.mock(
  '~features/admin-form/settings/components/AuthSettingsSection/StepLoginControls',
  () => ({
    StepLoginControls: ({
      onAuthTypeChange,
      isDisabled,
    }: {
      onAuthTypeChange: (type: FormAuthType) => void
      isDisabled: boolean
    }) => (
      <>
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => onAuthTypeChange(FormAuthType.MyInfo)}
        >
          Use Singpass
        </button>
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => onAuthTypeChange(FormAuthType.NIL)}
        >
          Turn off authentication
        </button>
      </>
    ),
  }),
)

const onSave = vi.fn()
const Harness = () => {
  const form = useForm<EditStepInputs>({
    defaultValues: {
      _id: 'step',
      workflow_type: WorkflowType.Static,
      emails: ['approver@example.gov.sg'],
      edit: ['uen', 'plain'],
      auth: { auth_type: FormAuthType.CP },
      is_approval_enabled: true,
      approval_field: 'approval',
    },
  })
  return (
    <form onSubmit={form.handleSubmit(onSave)}>
      <LoginBlock formMethods={form} stepNumber={1} isLoading={false} />
      <output data-testid="draft">{JSON.stringify(form.watch())}</output>
      <button type="submit">Save draft</button>
    </form>
  )
}
const draft = () => JSON.parse(screen.getByTestId('draft').textContent!)

describe('workflow authentication switch confirmation', () => {
  beforeEach(() => {
    onSave.mockReset()
    state.status = FormStatus.Private
  })

  it('cancels without changing the provider or field assignments', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Use Singpass' }))
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByText('Organisation UEN')).toBeInTheDocument()
    fireEvent.click(within(modal).getByRole('button', { name: 'Cancel' }))
    expect(draft().auth).toEqual({ auth_type: FormAuthType.CP })
    expect(draft().edit).toEqual(['uen', 'plain'])
    expect(onSave).not.toHaveBeenCalled()
  })

  it('unassigns only incompatible fields in the draft and saves them with the provider', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Use Singpass' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Unassign fields and switch to Singpass',
      }),
    )
    expect(draft().auth).toEqual({ auth_type: FormAuthType.MyInfo })
    expect(draft().edit).toEqual(['plain'])
    expect(draft().approval_field).toBe('approval')
    expect(draft().is_approval_enabled).toBe(true)
    expect(draft().emails).toEqual(['approver@example.gov.sg'])
    expect(fields.map((field) => field._id)).toEqual(['uen', 'plain'])
    expect(onSave).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        edit: ['plain'],
        auth: { auth_type: FormAuthType.MyInfo },
      }),
    )
  })

  it('can turn authentication off without deleting form fields, while public forms stay protected', () => {
    const view = render(<Harness />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Turn off authentication' }),
    )
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Unassign fields and turn off',
      }),
    )
    expect(draft().auth).toBeNull()
    expect(draft().edit).toEqual(['plain'])
    expect(fields).toHaveLength(2)
    view.unmount()
    state.status = FormStatus.Public
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Use Singpass' })).toBeDisabled()
  })
})
