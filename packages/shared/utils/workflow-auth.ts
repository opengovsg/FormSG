import {
  FormAuthType,
  FormWorkflowStepAuth,
  PublicWorkflowStepAuth,
  StepLoginAuthType,
  WhitelistedSubmitterIds,
} from '../types/form'

// The form-level fields that hold Step 1's login.
export interface FormLoginFields {
  authType: FormAuthType
  isSubmitterIdCollectionEnabled?: boolean
  isSingleSubmission?: boolean
  whitelistedSubmitterIds?: WhitelistedSubmitterIds | null
}

// Accepts admin (private list hidden) and public workflow projections.
export interface WorkflowStepWithAuth {
  auth?: FormWorkflowStepAuth | PublicWorkflowStepAuth
}

export interface ResolvedStepAuth {
  // Step 1 keeps its actual provider, including retired SP, SGID and SGID_MyInfo.
  authType: FormAuthType
  isSubmitterIdCollectionEnabled: boolean
  // Only Step 1 can limit responses to one per NRIC/FIN/UEN.
  isSingleSubmission: boolean
  isWhitelistEnabled: boolean
}

const NO_LOGIN: ResolvedStepAuth = {
  authType: FormAuthType.NIL,
  isSubmitterIdCollectionEnabled: false,
  isSingleSubmission: false,
  isWhitelistEnabled: false,
}

// Narrows a provider to the three logins an admin can pick; retired Singpass types map to MyInfo.
export const toStepLoginAuthType = (
  authType: FormAuthType,
): StepLoginAuthType => {
  switch (authType) {
    case FormAuthType.NIL:
    case FormAuthType.CP:
    case FormAuthType.MyInfo:
      return authType
    default:
      return FormAuthType.MyInfo
  }
}

// Whether a provider can prefill MyInfo fields.
export const isMyInfoAuthType = (authType: FormAuthType): boolean =>
  authType === FormAuthType.MyInfo || authType === FormAuthType.SGID_MyInfo

/**
 * The saved login for one workflow step. Step 1 (index 0) reads the form-level
 * fields; later steps read `step.auth`, and a step without one has no login.
 */
export const resolveStepAuth = (
  form: FormLoginFields,
  workflow: readonly WorkflowStepWithAuth[],
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
    // Public projections flatten the list; admin projections keep its enabled state.
    isWhitelistEnabled:
      'isWhitelistEnabled' in auth
        ? auth.isWhitelistEnabled
        : !!auth.whitelisted_submitter_ids?.isWhitelistEnabled,
  }
}

// Every step's login in order; a form with no steps still has Step 1.
export const resolveAllStepAuths = (
  form: FormLoginFields,
  workflow: readonly WorkflowStepWithAuth[] = [],
): ResolvedStepAuth[] =>
  workflow.length === 0
    ? [resolveStepAuth(form, workflow, 0)]
    : workflow.map((_, i) => resolveStepAuth(form, workflow, i))

// Index of the first step whose provider matches, or -1 if none does.
export const findFirstStepUsingAuthType = (
  form: FormLoginFields,
  workflow: readonly WorkflowStepWithAuth[] = [],
  matches: (authType: FormAuthType) => boolean,
): number =>
  resolveAllStepAuths(form, workflow).findIndex((resolved) =>
    matches(resolved.authType),
  )

// Whether any step's provider matches.
export const formUsesAuthType = (
  form: FormLoginFields,
  workflow: readonly WorkflowStepWithAuth[] = [],
  matches: (authType: FormAuthType) => boolean,
): boolean => findFirstStepUsingAuthType(form, workflow, matches) >= 0
