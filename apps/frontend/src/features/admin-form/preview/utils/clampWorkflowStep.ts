/** Clamps a step index into `[0, maxSteps - 1]` (or `0` if `maxSteps` is `0`). */
export const clampWorkflowStep = (step: number, maxSteps: number): number => {
  if (maxSteps <= 0) return 0
  return Math.min(Math.max(step, 0), maxSteps - 1)
}
