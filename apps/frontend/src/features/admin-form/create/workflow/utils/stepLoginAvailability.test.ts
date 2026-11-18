import {
  AdminFormDto,
  AdminMultirespondentFormDto,
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

const NO_LATER_LOGIN_WORKFLOW = [
  { _id: 's1', workflow_type: WorkflowType.Static, emails: [], edit: [] },
  { _id: 's2', workflow_type: WorkflowType.Static, emails: [], edit: [] },
] as AdminMultirespondentFormDto['workflow']

describe('isLaterStepLoginAvailable', () => {
  it('is hidden while the flag is off and no later step logs in', () => {
    expect(
      isLaterStepLoginAvailable(
        mrfForm({ workflow: NO_LATER_LOGIN_WORKFLOW }),
        false,
      ),
    ).toBe(false)
  })

  it('stays shown with the flag off once a later step has a login', () => {
    expect(isLaterStepLoginAvailable(mrfForm(), false)).toBe(true)
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
  it('reads only the form-level login while the flag is off and no later step logs in', () => {
    expect(
      formUsesLogin({
        form: mrfForm({ workflow: NO_LATER_LOGIN_WORKFLOW }),
        authType: FormAuthType.CP,
        isFlagOn: false,
      }),
    ).toBe(false)
    expect(
      formUsesLogin({
        form: mrfForm({
          authType: FormAuthType.CP,
          workflow: NO_LATER_LOGIN_WORKFLOW,
        }),
        authType: FormAuthType.CP,
        isFlagOn: false,
      }),
    ).toBe(true)
  })

  it('counts a saved later-step login while the flag is off', () => {
    expect(
      formUsesLogin({
        form: mrfForm(),
        authType: FormAuthType.CP,
        isFlagOn: false,
      }),
    ).toBe(true)
  })

  it('counts later steps once they can log in', () => {
    expect(
      formUsesLogin({
        form: mrfForm(),
        authType: FormAuthType.CP,
        isFlagOn: true,
      }),
    ).toBe(true)
    expect(
      formUsesLogin({
        form: mrfForm(),
        authType: FormAuthType.MyInfo,
        isFlagOn: true,
      }),
    ).toBe(false)
  })
})
