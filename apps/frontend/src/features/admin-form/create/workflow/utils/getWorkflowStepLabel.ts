/**
 * How a workflow step is named to an admin: the name they gave it, or its
 * position if they never named it. Shared between the builder and the publish-block modal.
 */
export const getWorkflowStepLabel = ({
  stepNumber,
  stepName,
  stepWord,
}: {
  stepNumber: number
  stepName?: string
  stepWord: string
}): string =>
  // `||` not `??`: an empty name would otherwise render as a blank label.
  stepName ||
  `${stepWord.charAt(0).toUpperCase()}${stepWord.slice(1)} ${stepNumber + 1}`
