import { BasicField, FormFieldDto } from 'formsg-shared/types/field'
import {
  FormAuthType,
  MrfStepAuthSessionDto,
  StrippedFormWorkflowDto,
  WorkflowType,
} from 'formsg-shared/types/form'

import { getPendingStepAuthType, mergeStepLoginSession } from './stepLogin'

const STEP_1_FIELD = {
  _id: 'step1',
  title: 'Request',
  fieldType: BasicField.ShortText,
} as FormFieldDto
const NAME_FIELD = {
  _id: 'name',
  title: 'Name',
  fieldType: BasicField.ShortText,
  myInfo: { attr: 'name' },
} as FormFieldDto
const NRIC_FIELD = {
  _id: 'nric',
  title: 'Approver NRIC',
  fieldType: BasicField.Nric,
  myInfo: { attr: 'uinfin' },
} as FormFieldDto

const WORKFLOW = [
  { _id: 's1', workflow_type: WorkflowType.Static, edit: ['step1'] },
  {
    _id: 's2',
    workflow_type: WorkflowType.Static,
    edit: ['name', 'nric'],
    auth: { auth_type: FormAuthType.MyInfo },
  },
  { _id: 's3', workflow_type: WorkflowType.Static, edit: [] },
] as StrippedFormWorkflowDto

const merge = (session: Partial<MrfStepAuthSessionDto>) =>
  mergeStepLoginSession({
    formFields: [STEP_1_FIELD, NAME_FIELD, NRIC_FIELD],
    workflow: WORKFLOW,
    workflowStep: 1,
    session: { workflowStep: 1, authType: FormAuthType.MyInfo, ...session },
  })

describe('getPendingStepAuthType', () => {
  it('reads the login of the step after the one last completed', () => {
    expect(
      getPendingStepAuthType({ workflow: WORKFLOW, workflowStep: 0 }),
    ).toBe(FormAuthType.MyInfo)
  })

  it.each([
    ['the pending step has no login', { workflow: WORKFLOW, workflowStep: 1 }],
    ['the workflow is finished', { workflow: WORKFLOW, workflowStep: 2 }],
    ['there is no submission', undefined],
  ])('is undefined when %s', (_, submission) => {
    expect(getPendingStepAuthType(submission)).toBeUndefined()
  })
})

describe('mergeStepLoginSession', () => {
  it("applies prefills to this step's fields only", () => {
    const { formFields, isLoggedIn } = merge({
      spcpSession: { userName: 'S1234567D' },
      prefilledFields: [
        { ...STEP_1_FIELD, fieldValue: 'replaced' },
        { ...NAME_FIELD, fieldValue: 'TAN AH KOW', disabled: true },
        { ...NRIC_FIELD, fieldValue: 'S1234567D', disabled: true },
      ] as FormFieldDto[],
    })

    expect(formFields).toEqual([
      STEP_1_FIELD,
      { ...NAME_FIELD, fieldValue: 'TAN AH KOW', disabled: true },
      { ...NRIC_FIELD, fieldValue: 'S1234567D', disabled: true },
    ])
    expect(isLoggedIn).toBe(true)
  })

  it.each<[string, Partial<MrfStepAuthSessionDto>, boolean]>([
    [
      'asks for MyInfo login again once the profile prefill was consumed',
      {
        spcpSession: { userName: 'S1234567D' },
        prefilledFields: [
          { ...NRIC_FIELD, fieldValue: 'S1234567D', disabled: true },
        ] as FormFieldDto[],
      },
      false,
    ],
    [
      'keeps a Corppass login across reloads',
      {
        authType: FormAuthType.CP,
        spcpSession: { userName: '201912345K' },
        prefilledFields: [],
      },
      true,
    ],
    ['is logged out without a session', {}, false],
  ])('%s', (_, session, isLoggedIn) => {
    expect(merge(session).isLoggedIn).toBe(isLoggedIn)
  })
})
