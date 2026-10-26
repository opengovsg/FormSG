import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
  WorkflowType,
} from 'formsg-shared/types'

import {
  formUsesLogin,
  isLaterStepLoginAvailable,
} from './stepLoginAvailability'

const mrfForm = (overrides: Partial<AdminFormDto> = {}) =>
  ({
    responseMode: FormResponseMode.Multirespondent,
    authType: FormAuthType.NIL,
    workflow: [
      { _id: 's1', workflow_type: WorkflowType.Static, emails: [], edit: [] },
      {
        _id: 's2',
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [],
        auth: { auth_type: FormAuthType.CP, esrvc_id: 'X' },
      },
    ],
    ...overrides,
  }) as AdminFormDto

describe('isLaterStepLoginAvailable', () => {
  it('is hidden while the flag is off', () => {
    expect(isLaterStepLoginAvailable(mrfForm(), false)).toBe(false)
  })

  it('is hidden on non-MRF forms', () => {
    expect(
      isLaterStepLoginAvailable(
        mrfForm({ responseMode: FormResponseMode.Encrypt }),
        true,
      ),
    ).toBe(false)
  })

  it('is hidden while the legacy collection toggle can still be converted', () => {
    expect(
      isLaterStepLoginAvailable(
        mrfForm({
          authType: FormAuthType.MyInfo,
          isSubmitterIdCollectionEnabled: true,
        }),
        true,
      ),
    ).toBe(false)
  })

  it('is shown on an MRF form with the flag on', () => {
    expect(isLaterStepLoginAvailable(mrfForm(), true)).toBe(true)
  })
})

describe('formUsesLogin', () => {
  it('reads only the form-level login while the flag is off', () => {
    expect(formUsesLogin(mrfForm(), FormAuthType.CP, false)).toBe(false)
    expect(
      formUsesLogin(
        mrfForm({ authType: FormAuthType.CP }),
        FormAuthType.CP,
        false,
      ),
    ).toBe(true)
  })

  it('counts later steps once they can log in', () => {
    expect(formUsesLogin(mrfForm(), FormAuthType.CP, true)).toBe(true)
    expect(formUsesLogin(mrfForm(), FormAuthType.MyInfo, true)).toBe(false)
  })
})
