import { fireEvent, render, screen } from '@testing-library/react'

import { FormAuthType, FormResponseMode, FormStatus } from 'formsg-shared/types'

import { useFieldLoginGate } from './FieldLoginContext'
import { FieldLoginGate } from './FieldLoginGate'

const state = vi.hoisted(() => ({
  form: {} as Record<string, unknown>,
  enabled: true,
  add: vi.fn(),
}))
vi.mock('../../useCreateTabForm', () => ({
  useCreateTabForm: () => ({ data: state.form }),
}))
vi.mock(
  '~features/admin-form/create/workflow/hooks/useIsMrfStepLoginEnabled',
  () => ({
    useIsMrfStepLoginEnabled: () => state.enabled,
  }),
)
const Options = () => {
  const request = useFieldLoginGate()
  return (
    <>
      <button onClick={() => request?.(FormAuthType.MyInfo, state.add)}>
        Add Name
      </button>
      <button onClick={() => request?.(FormAuthType.CP, state.add)}>
        Add UEN
      </button>
    </>
  )
}
const setup = () =>
  render(
    <FieldLoginGate>
      <Options />
    </FieldLoginGate>,
  )

describe('authentication field availability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.enabled = true
    state.form = {
      authType: FormAuthType.NIL,
      status: FormStatus.Private,
      responseMode: FormResponseMode.Multirespondent,
      isSubmitterIdCollectionEnabled: false,
      workflow: [{ edit: [] }, { edit: [] }],
    }
  })
  it('blocks both providers when no step supplies either, without offering a modal', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Add Name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add UEN' }))
    expect(state.add).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('allows Singpass fields but blocks Corppass fields when only Step 1 uses Singpass', () => {
    state.form.authType = FormAuthType.MyInfo
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Add Name' }))
    expect(state.add).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Add UEN' }))
    expect(state.add).toHaveBeenCalledTimes(1)
  })
  it.each([FormStatus.Private, FormStatus.Public])(
    'allows an unassigned field with a matching later-step provider on a %s form',
    (status) => {
      state.form.status = status
      state.form.workflow = [
        { edit: [] },
        { edit: [], auth: { auth_type: FormAuthType.CP } },
      ]
      setup()
      fireEvent.click(screen.getByRole('button', { name: 'Add UEN' }))
      expect(state.add).toHaveBeenCalledTimes(1)
    },
  )
  it('retains flag-off form-level availability', () => {
    state.enabled = false
    state.form.workflow = [
      { edit: [] },
      { edit: [], auth: { auth_type: FormAuthType.CP } },
    ]
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Add UEN' }))
    expect(state.add).not.toHaveBeenCalled()
  })
  it('allows matching authentication on non-workflow forms', () => {
    state.form.responseMode = FormResponseMode.Encrypt
    state.form.authType = FormAuthType.CP
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Add UEN' }))
    expect(state.add).toHaveBeenCalledTimes(1)
  })
})
