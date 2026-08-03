import {
  PublicSubmittedStep,
  SUBMITTED_STEP_VISIBILITY,
  SubmittedStep,
  SubmittedStepBoundary,
  SubmittedStepField,
  WebhookSubmittedStep,
} from 'formsg-shared/types'

const SUBMITTED_STEP_FIELDS = Object.keys(
  SUBMITTED_STEP_VISIBILITY,
) as SubmittedStepField[]

const projectSubmittedStep = (
  step: SubmittedStep,
  boundary: SubmittedStepBoundary,
): Record<string, unknown> => {
  const projected: Record<string, unknown> = {}
  for (const field of SUBMITTED_STEP_FIELDS) {
    if (!SUBMITTED_STEP_VISIBILITY[field][boundary]) continue
    const value = (step as Record<string, unknown>)[field]
    if (value !== undefined) projected[field] = value
  }
  return projected
}

export const projectSubmittedStepForWebhook = (
  step: SubmittedStep,
): WebhookSubmittedStep =>
  projectSubmittedStep(step, 'webhook') as WebhookSubmittedStep

export const projectSubmittedStepForPublic = (
  step: SubmittedStep,
): PublicSubmittedStep =>
  projectSubmittedStep(step, 'public') as PublicSubmittedStep

export const buildAdminSubmittedStepsMongoProjection = (): Record<string, 1> =>
  Object.fromEntries(
    SUBMITTED_STEP_FIELDS.filter(
      (field) => SUBMITTED_STEP_VISIBILITY[field].admin,
    ).map((field) => [`submittedSteps.${field}`, 1] as const),
  )
