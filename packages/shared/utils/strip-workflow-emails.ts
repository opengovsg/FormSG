import {
  FormWorkflowDto,
  FormWorkflowStepAuth,
  FormWorkflowStepDto,
  PublicWorkflowStepAuth,
  StrippedFormWorkflowDto,
  StrippedFormWorkflowStepDto,
  WorkflowType,
} from '../types'

// Keeps only the enabled state of a step's eligible-respondent list, dropping its private reference.
const stripAuthPrivateData = (
  auth: FormWorkflowStepAuth,
): FormWorkflowStepAuth => ({
  auth_type: auth.auth_type,
  is_submitter_id_collection_enabled: auth.is_submitter_id_collection_enabled,
  ...(auth.whitelisted_submitter_ids
    ? {
        whitelisted_submitter_ids: {
          isWhitelistEnabled:
            !!auth.whitelisted_submitter_ids.isWhitelistEnabled,
        },
      }
    : {}),
})

const toPublicAuth = (auth: FormWorkflowStepAuth): PublicWorkflowStepAuth => ({
  auth_type: auth.auth_type,
  is_submitter_id_collection_enabled: auth.is_submitter_id_collection_enabled,
  isWhitelistEnabled: !!auth.whitelisted_submitter_ids?.isWhitelistEnabled,
})

// Removes private login data only. Recipient emails are kept.
export function stripWorkflowAuthPrivateData(
  workflow: FormWorkflowDto,
): FormWorkflowDto {
  return workflow.map((step): FormWorkflowStepDto => {
    if (!step.auth) return step
    return { ...step, auth: stripAuthPrivateData(step.auth) }
  })
}

export function stripWorkflowEmails(
  workflow: FormWorkflowDto,
): StrippedFormWorkflowDto {
  return stripWorkflowAuthPrivateData(workflow).map(
    (step): StrippedFormWorkflowStepDto => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { auth, ...stepWithoutAuth } = step
      const publicAuth = auth ? { auth: toPublicAuth(auth) } : {}
      if (stepWithoutAuth.workflow_type === WorkflowType.Static) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { emails, ...rest } = stepWithoutAuth
        return { ...rest, ...publicAuth }
      }
      return { ...stepWithoutAuth, ...publicAuth }
    },
  )
}
