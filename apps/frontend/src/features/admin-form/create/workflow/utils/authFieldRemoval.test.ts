import {
  AdminMultirespondentFormDto,
  BasicField,
  CorppassAttribute,
  FormAuthType,
  LogicConditionState,
  LogicType,
  MyInfoAttribute,
  WorkflowType,
} from 'formsg-shared/types'

import {
  getAffectedAuthFieldRules,
  getAuthSwitchConsequences,
  getRemovedStepAuthFields,
  getWorkflowAuthOptions,
} from './authFieldRemoval'

const form = {
  authType: FormAuthType.MyInfo,
  form_fields: [
    {
      _id: 'name',
      title: 'Name',
      fieldType: BasicField.ShortText,
      myInfo: { attr: MyInfoAttribute.Name },
    },
    {
      _id: 'uen',
      title: 'UEN',
      fieldType: BasicField.Uen,
      corppass: { attr: CorppassAttribute.Uen },
    },
    {
      _id: 'unassigned',
      title: 'Company user',
      fieldType: BasicField.ShortText,
      corppass: { attr: CorppassAttribute.Uid },
    },
    { _id: 'plain', title: 'Comments', fieldType: BasicField.ShortText },
  ],
  form_logics: [
    {
      _id: 'logic',
      logicType: LogicType.ShowFields,
      conditions: [
        { field: 'uen', state: LogicConditionState.Equal, value: 'test' },
      ],
      show: ['plain'],
    },
  ],
  workflow: [
    {
      _id: 'one',
      workflow_type: WorkflowType.Static,
      edit: ['name'],
      emails: [],
    },
    {
      _id: 'two',
      workflow_type: WorkflowType.Static,
      edit: ['uen', 'plain'],
      emails: ['test@example.com'],
      auth: { auth_type: FormAuthType.CP, esrvc_id: 'service-a' },
    },
  ],
} as unknown as AdminMultirespondentFormDto

describe('authentication removal consequences', () => {
  it('includes unassigned fields when removing their last provider', () => {
    const result = getAuthSwitchConsequences(form, 1, FormAuthType.MyInfo, [
      'uen',
      'plain',
    ])
    expect(result.deletedFields.map((field) => field._id)).toEqual([
      'uen',
      'unassigned',
    ])
    expect(result.unassignedFields.map((field) => field._id)).toEqual(['uen'])
  })
  it('only unassigns when another step keeps the provider', () => {
    const next = {
      ...form,
      workflow: [
        ...form.workflow,
        { ...form.workflow[1], _id: 'three', edit: [] },
      ],
    }
    const result = getAuthSwitchConsequences(next, 1, FormAuthType.NIL, [
      'uen',
      'plain',
    ])
    expect(result.deletedFields).toEqual([])
    expect(result.unassignedFields.map((field) => field._id)).toEqual(['uen'])
  })
  it('deleting a later step includes all providerless fields', () => {
    expect(getRemovedStepAuthFields(form, 1).map((field) => field._id)).toEqual(
      ['uen', 'unassigned'],
    )
  })
  it('keeps distinct Corppass configurations but deduplicates identical IDs', () => {
    const next = {
      ...form,
      workflow: [
        ...form.workflow,
        { ...form.workflow[1], _id: 'three', edit: [] },
        {
          ...form.workflow[1],
          _id: 'four',
          edit: [],
          auth: { auth_type: FormAuthType.CP as const, esrvc_id: 'service-b' },
        },
      ],
    }
    expect(getWorkflowAuthOptions(next)).toEqual([
      { authType: FormAuthType.MyInfo, esrvcId: undefined },
      { authType: FormAuthType.CP, esrvcId: 'service-a' },
      { authType: FormAuthType.CP, esrvcId: 'service-b' },
    ])
  })
  it('labels the sole legacy Singpass provider without losing its configuration', () => {
    const legacy = {
      ...form,
      authType: FormAuthType.SP,
      workflow: [form.workflow[0]],
    }
    expect(getWorkflowAuthOptions(legacy)).toEqual([
      { authType: FormAuthType.MyInfo, esrvcId: undefined },
    ])
  })

  it('names affected logic rules without changing form definitions', () => {
    expect(getAffectedAuthFieldRules(form, ['uen'])).toEqual(['Logic rule 1'])
    expect(form.form_fields).toHaveLength(4)
  })
})
