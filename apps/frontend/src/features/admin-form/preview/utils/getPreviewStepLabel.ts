/**
 * Formats a workflow step for display in the preview UI, e.g. "Step 2: Approver".
 *
 * `step_name` is optional on a workflow step, so an unnamed step falls back to
 * its position alone. Steps are stored zero-indexed but shown one-indexed.
 */
export const getPreviewStepLabel = (
  step: { step_name?: string },
  index: number,
): string => `Step ${index + 1}${step.step_name ? `: ${step.step_name}` : ''}`
