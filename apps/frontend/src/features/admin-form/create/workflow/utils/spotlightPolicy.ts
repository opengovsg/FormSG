/**
 * When the section spotlight applies at all.
 *
 * Its own module, taking three plain facts rather than reading the guided
 * flow's state, so the rule is testable on its own and the flow does not have
 * to re-derive it at each call site.
 */

export interface SpotlightPolicyInput {
  /**
   * Zero-based, matching `WorkflowContent`'s `stepNumber={i}` and the workflow
   * store. "Step 3 and onwards" is therefore index 2 and above.
   */
  stepNumber: number
  /** Every section of this step has been revealed. */
  areAllSectionsVisible: boolean
  /** The per-step guided toggle is on. */
  isGuidanceOn: boolean
}

/**
 * The spotlight is on except in one situation: step 3 or later, with every
 * section already visible, and guidance switched off. There the admin has done
 * this twice already and asked not to be guided, so every section renders at
 * full weight and the card carries the treatment instead.
 *
 * Named for what it decides. The prototype's equivalents were named for a hint
 * (`showSkipGuidedHint`) and, earlier, for flow completion (`isFlowComplete`),
 * neither of which is what the value means: it is false on steps 1 and 2 no
 * matter how far through them the admin is.
 *
 * Steps 1 and 2 never return to full opacity in place. They reach it by
 * unmounting when the step saves, which is why there is no early-step case
 * here.
 */
export const isSpotlightEnabled = ({
  stepNumber,
  areAllSectionsVisible,
  isGuidanceOn,
}: SpotlightPolicyInput): boolean =>
  !(stepNumber >= 2 && areAllSectionsVisible && !isGuidanceOn)
