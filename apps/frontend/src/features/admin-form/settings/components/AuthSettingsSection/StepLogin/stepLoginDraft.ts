import { AdminMultirespondentFormDto, FormAuthType } from 'formsg-shared/types'
import {
  isMyInfoAuthType,
  resolveAllStepAuths,
  ResolvedStepAuth,
} from 'formsg-shared/utils/workflow-auth'

import { isMyInfo } from '~features/myinfo/utils'

// A staged eligible-respondent list: keep the saved one, remove it, or replace it.
export type WhitelistDraft =
  | { kind: 'saved' }
  | { kind: 'removed' }
  | { kind: 'new'; csvString: string; file: File }

export interface StepLoginDraft {
  // Step 1 keeps a retired provider until the admin picks one of the three logins.
  authType: FormAuthType
  isSubmitterIdCollectionEnabled: boolean
  isSingleSubmission: boolean
  whitelist: WhitelistDraft
  // Only entered in the row while the form has no shared e-service ID.
  esrvcId: string
}

export const toStepLoginDraft = (saved: ResolvedStepAuth): StepLoginDraft => ({
  authType: saved.authType,
  isSubmitterIdCollectionEnabled: saved.isSubmitterIdCollectionEnabled,
  isSingleSubmission: saved.isSingleSubmission,
  whitelist: { kind: 'saved' },
  esrvcId: '',
})

// Whether the saved list survives the save; a provider change drops it server-side.
export const hasSavedWhitelistFor = (
  saved: ResolvedStepAuth,
  authType: FormAuthType,
): boolean => saved.isWhitelistEnabled && saved.authType === authType

// Request value for whitelistCsvString: omitted keeps, null clears, a string replaces.
export const toWhitelistCsvString = (
  saved: ResolvedStepAuth,
  draft: StepLoginDraft,
): string | null | undefined => {
  if (draft.authType === FormAuthType.NIL) return undefined
  switch (draft.whitelist.kind) {
    case 'new':
      return draft.whitelist.csvString
    case 'removed':
      return saved.isWhitelistEnabled ? null : undefined
    case 'saved':
      return undefined
  }
}

// MyInfo field IDs in this step that must leave it because the draft login is not Singpass.
export const getRemovedMyInfoFieldIds = (
  form: AdminMultirespondentFormDto,
  stepIndex: number,
  authType: FormAuthType,
): string[] => {
  const step = form.workflow[stepIndex]
  if (!step || isMyInfoAuthType(authType)) return []
  const myInfoFieldIds = new Set(
    form.form_fields.filter(isMyInfo).map((field) => field._id),
  )
  return step.edit.filter((id) => myInfoFieldIds.has(id))
}

// Why a draft cannot be saved yet.
export type StepLoginDraftError =
  | 'noStepsMyInfo'
  | 'lastSingpassStep'
  | 'esrvcIdRequired'
  | 'esrvcIdWhitespace'

// Returns the first reason the draft cannot be saved, or undefined.
export const validateStepLoginDraft = (
  form: AdminMultirespondentFormDto,
  stepIndex: number,
  draft: StepLoginDraft,
): StepLoginDraftError | undefined => {
  const hasMyInfoFields = form.form_fields.some(isMyInfo)
  if (hasMyInfoFields && !isMyInfoAuthType(draft.authType)) {
    if (form.workflow.length === 0) return 'noStepsMyInfo'
    const hasOtherSingpassStep = resolveAllStepAuths(form, form.workflow).some(
      (resolved, i) => i !== stepIndex && isMyInfoAuthType(resolved.authType),
    )
    if (!hasOtherSingpassStep) return 'lastSingpassStep'
  }
  if (draft.authType === FormAuthType.CP && !form.esrvcId) {
    const esrvcId = draft.esrvcId.trim()
    if (!esrvcId) return 'esrvcIdRequired'
    if (/\s/.test(esrvcId)) return 'esrvcIdWhitespace'
  }
  return undefined
}
