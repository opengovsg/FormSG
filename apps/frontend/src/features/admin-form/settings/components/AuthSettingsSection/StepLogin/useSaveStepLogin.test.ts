import {
  AdminMultirespondentFormDto,
  BasicField,
  FormAuthType,
  WorkflowType,
} from 'formsg-shared/types'
import { ResolvedStepAuth } from 'formsg-shared/utils/workflow-auth'

import { updateWorkflowStep } from '~features/admin-form/create/workflow/FormWorkflowService'

import { StepLoginDraft } from './stepLoginDraft'
import { saveStepLogin } from './useSaveStepLogin'

vi.mock('~features/admin-form/create/workflow/FormWorkflowService')

const FORM_ID = '6a7de1810000000000000000'
const NAME_FIELD_ID = '6a7de1810000000000000001'
const YES_NO_FIELD_ID = '6a7de1810000000000000002'
const DELETED_FIELD_ID = '6a7de1810000000000000009'

const SAVED_NO_LOGIN: ResolvedStepAuth = {
  authType: FormAuthType.NIL,
  isSubmitterIdCollectionEnabled: false,
  isSingleSubmission: false,
  isWhitelistEnabled: false,
}
const DRAFT_CORPPASS: StepLoginDraft = {
  authType: FormAuthType.CP,
  isSubmitterIdCollectionEnabled: true,
  isSingleSubmission: false,
  whitelist: { kind: 'saved' },
  esrvcId: '',
}

const buildForm = (secondStep: Record<string, unknown>) =>
  ({
    _id: FORM_ID,
    esrvcId: 'example-service',
    authType: FormAuthType.NIL,
    form_fields: [
      { _id: NAME_FIELD_ID, fieldType: BasicField.ShortText },
      { _id: YES_NO_FIELD_ID, fieldType: BasicField.YesNo },
    ],
    workflow: [
      {
        _id: 'step-1',
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [NAME_FIELD_ID],
      },
      {
        _id: 'step-2',
        workflow_type: WorkflowType.Static,
        emails: ['two@example.gov.sg'],
        edit: [NAME_FIELD_ID],
        ...secondStep,
      },
    ],
  }) as unknown as AdminMultirespondentFormDto

const savedBody = () => vi.mocked(updateWorkflowStep).mock.calls[0][2]

describe('saveStepLogin', () => {
  beforeEach(() => {
    vi.mocked(updateWorkflowStep).mockReset()
    vi.mocked(updateWorkflowStep).mockResolvedValue([])
  })

  it('keeps the approval toggle on for a step saved before the toggle existed', async () => {
    const form = buildForm({ approval_field: YES_NO_FIELD_ID })

    await saveStepLogin({
      form,
      stepIndex: 1,
      saved: SAVED_NO_LOGIN,
      draft: DRAFT_CORPPASS,
    })

    expect(savedBody()).toMatchObject({
      approval_field: YES_NO_FIELD_ID,
      is_approval_enabled: true,
    })
  })

  it('drops an approval field that was deleted from the form instead of sending it', async () => {
    const form = buildForm({
      approval_field: DELETED_FIELD_ID,
      is_approval_enabled: true,
    })

    await saveStepLogin({
      form,
      stepIndex: 1,
      saved: SAVED_NO_LOGIN,
      draft: DRAFT_CORPPASS,
    })

    expect(savedBody().approval_field).toBeUndefined()
  })

  it('drops a respondent field that was deleted from the form of a dynamic step', async () => {
    const form = buildForm({
      workflow_type: WorkflowType.Dynamic,
      emails: undefined,
      field: DELETED_FIELD_ID,
    })

    await saveStepLogin({
      form,
      stepIndex: 1,
      saved: SAVED_NO_LOGIN,
      draft: DRAFT_CORPPASS,
    })

    expect(savedBody()).not.toHaveProperty('field')
  })
})
