import { act, renderHook } from '@testing-library/react'

import {
  AdminMultirespondentFormDto,
  BasicField,
  CorppassAttribute,
  FormAuthType,
  MyInfoAttribute,
  WorkflowType,
} from 'formsg-shared/types'

import { useStepLoginSwitch } from './useStepLoginSwitch'

// Step 1 logs in with Singpass. Step 2 is the form's only Corppass step and
// fills the UEN field.
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
  ],
  form_logics: [],
  workflow: [
    { _id: 'one', workflow_type: WorkflowType.Static, edit: [], emails: [] },
    {
      _id: 'two',
      workflow_type: WorkflowType.Static,
      edit: ['uen'],
      emails: ['test@example.com'],
      auth: { auth_type: FormAuthType.CP, esrvc_id: 'service' },
    },
  ],
} as unknown as AdminMultirespondentFormDto

const renderSwitch = (authType = FormAuthType.CP) => {
  const onSwitch = vi.fn()
  const { result } = renderHook(() =>
    useStepLoginSwitch({
      form,
      stepNumber: 1,
      authType,
      assignedIds: ['uen'],
      isDisabled: false,
      onSwitch,
    }),
  )
  return { result, onSwitch }
}

describe('useStepLoginSwitch', () => {
  it('confirms deleting fields when a picked field moves the last Corppass step to Singpass', () => {
    const { result, onSwitch } = renderSwitch()

    act(() => result.current.requestSwitch(FormAuthType.MyInfo, 'name'))

    // Nothing changes until the admin confirms
    expect(onSwitch).not.toHaveBeenCalled()
    expect(result.current.confirmationProps).toMatchObject({
      nextAuthType: FormAuthType.MyInfo,
      assignedField: { _id: 'name' },
      deleteFields: true,
      fields: [{ _id: 'uen' }],
    })

    act(() => result.current.confirmationProps.onConfirm())

    expect(onSwitch).toHaveBeenCalledWith({
      authType: FormAuthType.MyInfo,
      unassignedIds: ['uen'],
      deletedIds: ['uen'],
      assignedId: 'name',
    })
    expect(result.current.isPending).toBe(false)
  })

  it('switches at once when no field moves', () => {
    const { result, onSwitch } = renderSwitch(FormAuthType.NIL)

    act(() => result.current.requestSwitch(FormAuthType.CP))

    expect(onSwitch).toHaveBeenCalledWith({
      authType: FormAuthType.CP,
      unassignedIds: [],
      deletedIds: [],
      assignedId: undefined,
    })
  })

  it('does nothing when cancelled', () => {
    const { result, onSwitch } = renderSwitch()

    act(() => result.current.requestSwitch(FormAuthType.NIL))
    act(() => result.current.confirmationProps.onClose())

    expect(onSwitch).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(false)
  })
})
