import {
  FormAuthType,
  FormWorkflowStepAuth,
  PublicWorkflowStepAuth,
  StepLoginAuthType,
  WhitelistedSubmitterIds,
} from '../types/form'

/** The form-level fields that hold step 1's login. */
export interface FormLoginFields {
  authType: FormAuthType
  isSubmitterIdCollectionEnabled?: boolean
  isSingleSubmission?: boolean
  whitelistedSubmitterIds?: WhitelistedSubmitterIds | null
}

/** A workflow step's login as either admin/internal or public projection. */
export interface WorkflowStepLoginSource {
  auth?: FormWorkflowStepAuth | PublicWorkflowStepAuth | null
}

export interface ResolvedStepAuth {
  /** Step 1 keeps its actual form-level provider, including legacy ones. */
  authType: FormAuthType
  isSubmitterIdCollectionEnabled: boolean
  /** Only step 1 can limit responses to one per NRIC/FIN/UEN. */
  isSingleSubmission: boolean
  isWhitelistEnabled: boolean
}

const NO_LOGIN: ResolvedStepAuth = {
  authType: FormAuthType.NIL,
  isSubmitterIdCollectionEnabled: false,
  isSingleSubmission: false,
  isWhitelistEnabled: false,
}

/** Editor-only: maps retired Singpass types (SP, SGID, SGID_MyInfo) to MyInfo. */
export const toStepLoginAuthType = (
  authType: FormAuthType,
): StepLoginAuthType => {
  switch (authType) {
    case FormAuthType.NIL:
    case FormAuthType.CP:
      return authType
    default:
      return FormAuthType.MyInfo
  }
}

/** Whether `authType` is one of the three logins the step editor offers. */
export const isStepLoginAuthType = (
  authType: FormAuthType,
): authType is StepLoginAuthType =>
  authType === FormAuthType.NIL ||
  authType === FormAuthType.MyInfo ||
  authType === FormAuthType.CP

/** Whether a login can prefill MyInfo fields (legacy sgID with MyInfo included). */
export const isMyInfoAuthType = (authType: FormAuthType): boolean =>
  authType === FormAuthType.MyInfo || authType === FormAuthType.SGID_MyInfo

const isStepWhitelistEnabled = (
  auth: FormWorkflowStepAuth | PublicWorkflowStepAuth,
): boolean =>
  'isWhitelistEnabled' in auth
    ? auth.isWhitelistEnabled
    : !!auth.whitelisted_submitter_ids?.isWhitelistEnabled

/** One step's login: step 1 reads form-level fields, later steps `step.auth` (absent = no login). */
export const resolveStepAuth = (
  form: FormLoginFields,
  workflow: readonly WorkflowStepLoginSource[],
  stepIndex: number,
): ResolvedStepAuth => {
  if (stepIndex === 0) {
    if (form.authType === FormAuthType.NIL) return NO_LOGIN
    return {
      authType: form.authType,
      isSubmitterIdCollectionEnabled: !!form.isSubmitterIdCollectionEnabled,
      isSingleSubmission: !!form.isSingleSubmission,
      isWhitelistEnabled: !!form.whitelistedSubmitterIds?.isWhitelistEnabled,
    }
  }
  const auth = workflow[stepIndex]?.auth
  if (!auth) return NO_LOGIN
  return {
    authType: auth.auth_type,
    isSubmitterIdCollectionEnabled: auth.is_submitter_id_collection_enabled,
    isSingleSubmission: false,
    isWhitelistEnabled: isStepWhitelistEnabled(auth),
  }
}

/** Every step's login in order; a form with no steps still has step 1. */
export const resolveAllStepAuths = (
  form: FormLoginFields,
  workflow: readonly WorkflowStepLoginSource[] = [],
): ResolvedStepAuth[] =>
  workflow.length === 0
    ? [resolveStepAuth(form, workflow, 0)]
    : workflow.map((_, i) => resolveStepAuth(form, workflow, i))

/** Index of the first step that uses `authType`, or -1 if none does. */
export const findFirstStepUsingAuthType = (
  form: FormLoginFields,
  workflow: readonly WorkflowStepLoginSource[] = [],
  authType: FormAuthType,
): number =>
  resolveAllStepAuths(form, workflow).findIndex(
    (resolved) => resolved.authType === authType,
  )

/** Whether any step uses `authType`. */
export const formUsesAuthType = (
  form: FormLoginFields,
  workflow: readonly WorkflowStepLoginSource[] = [],
  authType: FormAuthType,
): boolean => findFirstStepUsingAuthType(form, workflow, authType) >= 0

/** Whether any step's login can prefill MyInfo fields. */
export const formUsesMyInfo = (
  form: FormLoginFields,
  workflow: readonly WorkflowStepLoginSource[] = [],
): boolean =>
  resolveAllStepAuths(form, workflow).some((resolved) =>
    isMyInfoAuthType(resolved.authType),
  )
