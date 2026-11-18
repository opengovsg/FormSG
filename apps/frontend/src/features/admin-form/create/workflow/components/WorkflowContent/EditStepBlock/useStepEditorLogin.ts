import { useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { uniq } from 'lodash'

import {
  AdminMultirespondentFormDto,
  FirstStepLoginInput,
  FormAuthType,
} from 'formsg-shared/types'
import { getAuthEsrvcId } from 'formsg-shared/utils/step-login'

import {
  StepLoginSwitch,
  useStepLoginSwitch,
} from '../../../hooks/useStepLoginSwitch'
import { EditStepInputs } from '../../../types'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { FIELDS_TO_EDIT_NAME } from './EditStepBlock'

/**
 * The login a step is being edited to, as a draft in the step form. Step 1
 * edits the form-level login through `first_step_login`; later steps edit
 * their own `auth`.
 */
export const useStepEditorLogin = ({
  form,
  formMethods,
  stepNumber,
  isDisabled,
  onSwitched,
}: {
  form: AdminMultirespondentFormDto | undefined
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
  isDisabled: boolean
  onSwitched?: (change: StepLoginSwitch) => void
}) => {
  const { watch, setValue } = formMethods
  // The version the admin reviews deletions against. The server refuses the
  // save if the form changed since.
  const reviewedAt = useRef(form?.lastModified)
  const isFirstStep = isFirstStepByStepNumber(stepNumber)
  const editedFirstStepLogin = watch('first_step_login')
  const editedAuth = watch('auth')
  const pickedFieldIds: string[] = watch(FIELDS_TO_EDIT_NAME) ?? []

  const login: FirstStepLoginInput | { auth_type: FormAuthType } = isFirstStep
    ? (editedFirstStepLogin ?? {
        auth_type: form?.authType ?? FormAuthType.NIL,
        esrvc_id: form?.esrvcId,
      })
    : {
        auth_type: editedAuth?.auth_type ?? FormAuthType.NIL,
        esrvc_id: getAuthEsrvcId(editedAuth),
      }
  const esrvcId = 'esrvc_id' in login ? login.esrvc_id : undefined

  const writeLogin = (authType: FormAuthType, nextEsrvcId = esrvcId) => {
    const corppassId =
      authType === FormAuthType.CP && nextEsrvcId !== undefined
        ? { esrvc_id: nextEsrvcId }
        : {}
    if (isFirstStep) {
      setValue(
        'first_step_login',
        authType === FormAuthType.SP
          ? undefined
          : { auth_type: authType, ...corppassId },
        { shouldDirty: true },
      )
      return
    }
    setValue(
      'auth',
      authType === FormAuthType.CP
        ? { auth_type: FormAuthType.CP, ...corppassId }
        : authType === FormAuthType.MyInfo
          ? { auth_type: FormAuthType.MyInfo }
          : null,
      { shouldDirty: true },
    )
  }

  const loginSwitch = useStepLoginSwitch({
    form,
    stepNumber,
    authType: login.auth_type,
    assignedIds: pickedFieldIds,
    isDisabled,
    onSwitch: (change) => {
      const { authType, unassignedIds, deletedIds, assignedId } = change
      const unassigned = new Set(unassignedIds)
      setValue(
        FIELDS_TO_EDIT_NAME,
        uniq([
          ...pickedFieldIds.filter((id) => !unassigned.has(id)),
          ...(assignedId ? [assignedId] : []),
        ]),
        { shouldDirty: true, shouldValidate: true },
      )
      setValue('delete_auth_field_ids', deletedIds, { shouldDirty: true })
      setValue(
        'expected_last_modified',
        deletedIds.length ? reviewedAt.current : undefined,
        { shouldDirty: true },
      )
      writeLogin(authType)
      onSwitched?.(change)
    },
  })

  return { login, esrvcId, writeLogin, ...loginSwitch }
}
