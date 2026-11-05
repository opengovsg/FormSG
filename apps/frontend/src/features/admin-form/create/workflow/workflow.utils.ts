import { FormFieldDto } from 'formsg-shared/types/field'
import {
  FirstStepLoginInput,
  FormAuthType,
  FormWorkflowStep,
  FormWorkflowStepAuth,
} from 'formsg-shared/types/form'
import { isStepComplete } from 'formsg-shared/utils/workflow-step-completion'

/** How many completed steps count as "the admin has set up a workflow". */
const COMPLETED_STEPS_FOR_FEEDBACK = 2

/**
 * Whether a workflow has enough completed steps to prompt the admin for
 * feedback. Takes the whole workflow so the positional first-step rule stays
 */
export const isWorkflowFeedbackEligible = (
  workflow: FormWorkflowStep[],
  formFields: FormFieldDto[],
): boolean =>
  workflow.filter((step, stepNumber) =>
    isStepComplete(step, formFields, stepNumber),
  ).length >= COMPLETED_STEPS_FOR_FEEDBACK

/**
 * A later step's login as sent: null when the step has none, since the
 * backend keeps the saved login when auth is absent.
 */
export const normaliseStepAuth = (
  auth: FormWorkflowStepAuth | null | undefined,
): FormWorkflowStepAuth | null => {
  if (!auth) return null
  if (auth.auth_type === FormAuthType.MyInfo)
    return { auth_type: auth.auth_type }
  // An empty e-service ID is omitted.
  const esrvcId = auth.esrvc_id?.trim()
  return {
    auth_type: FormAuthType.CP,
    ...(esrvcId ? { esrvc_id: esrvcId } : {}),
  }
}

// Step 1's login updates the form-level settings, where a missing e-service
// ID means "unchanged". Send a cleared Corppass ID as '' so it is saved.
export const normaliseFirstStepLogin = (
  login: FirstStepLoginInput | undefined,
): { first_step_login?: FirstStepLoginInput } =>
  login
    ? {
        first_step_login: {
          auth_type: login.auth_type,
          ...(login.auth_type === FormAuthType.CP
            ? { esrvc_id: login.esrvc_id?.trim() ?? '' }
            : {}),
        },
      }
    : {}
