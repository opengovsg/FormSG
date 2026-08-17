/**
 * `features.common.entities.step` is a lowercase noun, because that block is
 * built for composing sentences ('form', 'field', 'proof of payment'). A step
 * label is not a sentence, so it takes a capital here rather than in the
 * locale, which would leave a capitalised word in a lowercase-noun block for
 * the next person to trip over.
 */
const sentenceCase = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1)

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
}): string => stepName || `${sentenceCase(stepWord)} ${stepNumber + 1}`
// `||` rather than `??`: an empty name is not a name, and would otherwise
// render as a blank label.
