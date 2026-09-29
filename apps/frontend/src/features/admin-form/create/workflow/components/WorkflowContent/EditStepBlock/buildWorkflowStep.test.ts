import { FormAuthType, WorkflowType } from 'formsg-shared/types'

import { EditStepInputs } from '../../../types'

import { buildWorkflowStep } from './EditStepBlock'

const FIELD_ID = '6a7de1810000000000000001'

const baseInputs = (overrides: Partial<EditStepInputs> = {}) =>
  ({
    _id: 'step-1',
    workflow_type: WorkflowType.Static,
    edit: [FIELD_ID],
    emails: [],
    ...overrides,
  }) as EditStepInputs

describe('buildWorkflowStep', () => {
  it.each<[string, Partial<EditStepInputs>, string]>([
    ['dynamic, no field', { workflow_type: WorkflowType.Dynamic }, 'field'],
    [
      'dynamic, empty field',
      { workflow_type: WorkflowType.Dynamic, field: '' },
      'field',
    ],
    [
      'conditional, no dropdown',
      { workflow_type: WorkflowType.Conditional },
      'conditional_field',
    ],
    [
      'conditional, empty dropdown',
      { workflow_type: WorkflowType.Conditional, conditional_field: '' },
      'conditional_field',
    ],
  ])('should build %s, omitting the key', (_name, overrides, omittedKey) => {
    const step = buildWorkflowStep(baseInputs(overrides), false)

    expect(step?.workflow_type).toEqual(overrides.workflow_type)
    expect(step).not.toHaveProperty(omittedKey)
  })

  // Step 1 is always static ("anyone with the link"). A legacy dynamic step 1
  // may carry a `field` pointing at a deleted email field, which the backend
  // rejects — saving must rewrite it to static and drop the field.
  it.each<[string, Partial<EditStepInputs>]>([
    ['no field is set', {}],
    [
      'a legacy dynamic field is set',
      { workflow_type: WorkflowType.Dynamic, field: FIELD_ID },
    ],
  ])('should build the first step as static when %s', (_name, overrides) => {
    const step = buildWorkflowStep(baseInputs(overrides), true)

    expect(step?.workflow_type).toEqual(WorkflowType.Static)
    expect(step).not.toHaveProperty('field')
  })

  it.each<[string, Partial<EditStepInputs>, boolean, boolean]>([
    ['on with no field chosen', { is_approval_enabled: true }, false, true],
    [
      'on with a field chosen',
      { is_approval_enabled: true, approval_field: FIELD_ID },
      false,
      true,
    ],
    ['off', { is_approval_enabled: false }, false, false],
    ['never touched', {}, false, false],
    ['on for the first step', { is_approval_enabled: true }, true, true],
  ])(
    'should persist the approval toggle when %s',
    (_name, overrides, isFirstStep, expected) => {
      const step = buildWorkflowStep(baseInputs(overrides), isFirstStep)

      expect(step).toHaveProperty('is_approval_enabled', expected)
    },
  )

  it('should save a step with no respondent type as static with no emails', () => {
    const step = buildWorkflowStep(
      baseInputs({ workflow_type: undefined }),
      false,
    )

    expect(step?.workflow_type).toEqual(WorkflowType.Static)
    expect(step).toHaveProperty('emails', [])
  })

  it('should omit an unchanged saved login so the server keeps it and its list', () => {
    const step = buildWorkflowStep(
      baseInputs({
        auth: {
          auth_type: FormAuthType.CP,
          is_submitter_id_collection_enabled: true,
          whitelisted_submitter_ids: { isWhitelistEnabled: true },
        },
      }),
      false,
    )

    expect(step).not.toHaveProperty('auth')
    expect(step).not.toHaveProperty('whitelistCsvString')
  })

  it('should send a staged later-step login without any list reference', () => {
    const step = buildWorkflowStep(
      baseInputs({
        auth: {
          auth_type: FormAuthType.CP,
          is_submitter_id_collection_enabled: true,
          whitelisted_submitter_ids: { isWhitelistEnabled: true },
        },
        login_auth: {
          auth_type: FormAuthType.MyInfo,
          is_submitter_id_collection_enabled: false,
        },
      }),
      false,
    )

    expect(step?.auth).toEqual({
      auth_type: FormAuthType.MyInfo,
      is_submitter_id_collection_enabled: false,
    })
  })

  it('should send null to remove a later step login', () => {
    const step = buildWorkflowStep(baseInputs({ login_auth: null }), false)

    expect(step).toHaveProperty('auth', null)
  })

  it('should never send auth for step 1, whose login is form-level', () => {
    const step = buildWorkflowStep(
      baseInputs({
        login_auth: {
          auth_type: FormAuthType.MyInfo,
          is_submitter_id_collection_enabled: false,
        },
      }),
      true,
    )

    expect(step).not.toHaveProperty('auth')
  })

  it('should send step 1 login changes as form-level input', () => {
    const firstStepLogin = {
      authType: FormAuthType.MyInfo,
      isSubmitterIdCollectionEnabled: true,
      isSingleSubmission: false,
    }
    const step = buildWorkflowStep(
      baseInputs({ first_step_login: firstStepLogin }),
      true,
    )

    expect(step?.first_step_login).toEqual(firstStepLogin)
    expect(step).not.toHaveProperty('esrvc_id')
  })

  it('should never send step 1 login from a later step', () => {
    const step = buildWorkflowStep(
      baseInputs({
        first_step_login: {
          authType: FormAuthType.CP,
          isSubmitterIdCollectionEnabled: false,
          isSingleSubmission: false,
        },
      }),
      false,
    )

    expect(step).not.toHaveProperty('first_step_login')
  })

  it.each([true, false])(
    'should send a changed e-service ID and staged list in the same save (first step: %s)',
    (isFirstStep) => {
      const step = buildWorkflowStep(
        baseInputs({
          esrvc_id: 'NEW-ESRVC-ID',
          whitelistCsvString: 'S1234567D',
        }),
        isFirstStep,
      )

      expect(step).toHaveProperty('esrvc_id', 'NEW-ESRVC-ID')
      expect(step).toHaveProperty('whitelistCsvString', 'S1234567D')
    },
  )

  it('should send null to remove a saved list', () => {
    const step = buildWorkflowStep(
      baseInputs({ whitelistCsvString: null }),
      false,
    )

    expect(step).toHaveProperty('whitelistCsvString', null)
  })
})
