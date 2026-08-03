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

/**
 * Copies the fields visible at `boundary` out of `step` into a fresh plain
 * object.
 *
 * RATIONALE: builds up rather than deletes down. `getWebhookView` hands us
 * mongoose subdocuments, so spreading or deleting would carry mongoose
 * internals (and any future subdocument field) across the boundary.
 *
 * Field classification lives in shared (`SUBMITTED_STEP_VISIBILITY`); this
 * module is the server-side enforcer at each exit boundary.
 */
const projectSubmittedStep = (
  step: SubmittedStep,
  boundary: SubmittedStepBoundary,
): Record<string, unknown> => {
  const projected: Record<string, unknown> = {}
  for (const field of SUBMITTED_STEP_FIELDS) {
    if (!SUBMITTED_STEP_VISIBILITY[field][boundary]) continue
    const value = (step as Record<string, unknown>)[field]
    // Explicit undefined check so falsy-but-meaningful values (notably
    // `isApproval: false`) are still copied.
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

/**
 * The Mongo sub-field projection for the two admin queries, derived from the
 * `admin` column.
 *
 * RATIONALE: projecting at the query rather than in JS keeps the internal
 * fields from loading at all, and keeps the export cursor free of per-document
 * work.
 */
export const buildAdminSubmittedStepsMongoProjection = (): Record<string, 1> =>
  Object.fromEntries(
    SUBMITTED_STEP_FIELDS.filter(
      (field) => SUBMITTED_STEP_VISIBILITY[field].admin,
    ).map((field) => [`submittedSteps.${field}`, 1] as const),
  )
