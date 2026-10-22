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

  describe('step login', () => {
    it('should omit auth from a later step with no login', () => {
      const step = buildWorkflowStep(baseInputs({ auth: null }), false)

      expect(step).toHaveProperty('auth', undefined)
      expect(step).not.toHaveProperty('first_step_login')
    })

    it('should send a saved login back unchanged', () => {
      const step = buildWorkflowStep(
        baseInputs({ auth: { auth_type: FormAuthType.MyInfo } }),
        false,
      )

      expect(step?.auth).toEqual({ auth_type: FormAuthType.MyInfo })
    })

    it('should trim the Corppass e-service ID and omit it when empty', () => {
      const trimmed = buildWorkflowStep(
        baseInputs({ auth: { auth_type: FormAuthType.CP, esrvc_id: ' X1 ' } }),
        false,
      )
      const empty = buildWorkflowStep(
        baseInputs({ auth: { auth_type: FormAuthType.CP, esrvc_id: '  ' } }),
        false,
      )

      expect(trimmed?.auth).toEqual({
        auth_type: FormAuthType.CP,
        esrvc_id: 'X1',
      })
      expect(empty?.auth).toEqual({ auth_type: FormAuthType.CP })
    })

    it('should only send first_step_login for Step 1 once it was changed', () => {
      const untouched = buildWorkflowStep(baseInputs(), true)
      const changed = buildWorkflowStep(
        baseInputs({
          first_step_login: { auth_type: FormAuthType.CP, esrvc_id: ' X1 ' },
        }),
        true,
      )

      expect(untouched).not.toHaveProperty('first_step_login')
      expect(untouched).not.toHaveProperty('auth')
      expect(changed?.first_step_login).toEqual({
        auth_type: FormAuthType.CP,
        esrvc_id: 'X1',
      })
    })

    it('should send a cleared Step 1 Corppass e-service ID as empty', () => {
      const cleared = buildWorkflowStep(
        baseInputs({
          first_step_login: { auth_type: FormAuthType.CP, esrvc_id: '  ' },
        }),
        true,
      )
      const singpass = buildWorkflowStep(
        baseInputs({
          first_step_login: { auth_type: FormAuthType.MyInfo, esrvc_id: 'X' },
        }),
        true,
      )

      expect(cleared?.first_step_login).toEqual({
        auth_type: FormAuthType.CP,
        esrvc_id: '',
      })
      expect(singpass?.first_step_login).toEqual({
        auth_type: FormAuthType.MyInfo,
      })
    })
  })
})
