/**
 * How a workflow step is named to an admin: the name they gave it, or its
 * position if they never named it. Shared so the builder and the publish-block
 * modal cannot drift into two labelling schemes.
 *
 * `stepWord` arrives already translated, so this stays a plain function.
 * `features.common.entities.step` is lowercase for composing sentences, so the
 * capital belongs here rather than in the locale.
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
