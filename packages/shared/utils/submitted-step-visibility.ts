import {
  StatusTrackerSubmittedStep,
  SUBMITTED_STEP_VISIBILITY,
  SubmittedStep,
  SubmittedStepBoundary,
  SubmittedStepField,
  WebhookSubmittedStep,
} from '../types/submission'

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

export const projectSubmittedStepForStatusTracker = (
  step: SubmittedStep,
): StatusTrackerSubmittedStep =>
  projectSubmittedStep(step, 'statusTracker') as StatusTrackerSubmittedStep
