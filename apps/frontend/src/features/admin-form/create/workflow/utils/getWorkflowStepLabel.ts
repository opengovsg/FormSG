/**
 * How a workflow step is named to an admin: the name they gave it, or its
 * position if they never named it.
 *
 * Steps are 1-indexed for display. `stepWord` is passed in already translated
 * so this stays a plain function, callable outside a component.
 *
 * Kept in one place so the builder and the publish-block modal cannot drift
 * into two different labelling schemes.
 */
export const getWorkflowStepLabel = ({
  stepNumber,
  stepName,
  stepWord,
}: {
  stepNumber: number
  stepName?: string
  stepWord: string
}): string => stepName || `${stepWord} ${stepNumber + 1}`
// `||` rather than `??`: an empty name is not a name, and would otherwise
// render as a blank label.
