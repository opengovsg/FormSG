/** URL query-param key used to persist the current MRF workflow step in preview mode. */
export const PREVIEW_STEP_PARAM = 'step'

/**
 * Returns a copy of `prev` with the step param set to `step`, or removed when
 * `step` is `0` so the first step has a single canonical URL (no param).
 */
export const withPreviewStepParam = (
  prev: URLSearchParams,
  step: number,
): URLSearchParams => {
  const next = new URLSearchParams(prev)
  if (step === 0) {
    next.delete(PREVIEW_STEP_PARAM)
  } else {
    next.set(PREVIEW_STEP_PARAM, String(step))
  }
  return next
}
