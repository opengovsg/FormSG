import { useState } from 'react'

import { AdminMultirespondentFormDto, FormAuthType } from 'formsg-shared/types'

import type { AuthSwitchConfirmationProps } from '~features/admin-form/settings/components/AuthSettingsSection/AuthSwitchConfirmation'

import {
  getAffectedAuthFieldRules,
  getAuthSwitchConsequences,
} from '../utils/authFieldRemoval'

export type StepLoginSwitch = {
  authType: FormAuthType
  // Fields on the step the new login cannot fill
  unassignedIds: string[]
  // Fields no step's login can fill any more, confirmed for deletion
  deletedIds: string[]
  // The field the admin picked that needs the new login, if any
  assignedId?: string
}

type PendingSwitch = { authType: FormAuthType; assignedId?: string }

const NO_CONSEQUENCES: ReturnType<typeof getAuthSwitchConsequences> = {
  deletedFields: [],
  unassignedFields: [],
}

/**
 * Changing a step's login can strand fields: those on the step move off it,
 * and those no step can fill any more are deleted. Every way of changing a
 * step's login goes through here, so the admin always confirms both.
 */
export const useStepLoginSwitch = ({
  form,
  stepNumber,
  authType,
  assignedIds,
  isDisabled,
  onSwitch,
}: {
  // Undefined while the form loads; nothing can switch until it has.
  form: AdminMultirespondentFormDto | undefined
  stepNumber: number
  authType: FormAuthType
  assignedIds: readonly string[]
  isDisabled: boolean
  onSwitch: (change: StepLoginSwitch) => void
}) => {
  const [pending, setPending] = useState<PendingSwitch>()

  const consequencesOf = (next: FormAuthType | undefined) =>
    form && next !== undefined
      ? getAuthSwitchConsequences(
          form,
          stepNumber,
          next === FormAuthType.SP ? FormAuthType.NIL : next,
          assignedIds,
        )
      : NO_CONSEQUENCES

  const apply = ({ authType: next, assignedId }: PendingSwitch) => {
    const { deletedFields, unassignedFields } = consequencesOf(next)
    onSwitch({
      authType: next,
      unassignedIds: unassignedFields.map((field) => field._id),
      deletedIds: deletedFields.map((field) => field._id),
      assignedId,
    })
  }

  /** Switches at once, or asks first when fields move or a field is added. */
  const requestSwitch = (next: FormAuthType, assignedId?: string) => {
    if (!form || isDisabled || next === authType) return
    // Legacy SP can only restore the first step's saved form-level login.
    if (
      next === FormAuthType.SP &&
      (stepNumber !== 0 || form.authType !== FormAuthType.SP)
    )
      return
    const { deletedFields, unassignedFields } = consequencesOf(next)
    if (assignedId || deletedFields.length || unassignedFields.length) {
      setPending({ authType: next, assignedId })
      return
    }
    apply({ authType: next })
  }

  const consequences = consequencesOf(pending?.authType)
  const isDeleting = consequences.deletedFields.length > 0
  const formFields = form?.form_fields ?? []

  const confirmationProps: AuthSwitchConfirmationProps = {
    currentAuthType: authType,
    nextAuthType: pending?.authType,
    assignedField: formFields.find(
      (field) => field._id === pending?.assignedId,
    ),
    fields: isDeleting
      ? consequences.deletedFields
      : consequences.unassignedFields,
    formFields,
    deleteFields: isDeleting,
    affectedRules: form
      ? getAffectedAuthFieldRules(
          form,
          consequences.deletedFields.map((field) => field._id),
        )
      : [],
    onClose: () => setPending(undefined),
    onConfirm: () => {
      if (!pending || isDisabled) return
      apply(pending)
      setPending(undefined)
    },
  }

  return { isPending: !!pending, requestSwitch, confirmationProps }
}
