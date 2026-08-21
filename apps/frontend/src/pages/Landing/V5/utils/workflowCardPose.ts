/** Vertical offset of the first landed card, in px. */
const STACK_TOP_PX = 30
/** Gap between landed cards, in px. Less than a card's height, so they overlap
 *  like a physical stack rather than sitting in a list. */
const STACK_STEP_PX = 44
/** Where a card waits before it lands: above the stack and out of sight. */
const STACK_ENTRY_PX = -120

export interface WorkflowCardPose {
  transform: string
  opacity: number
}

/**
 * Where a card in the stamped stack sits, landed or waiting.
 *
 * Cards alternate their tilt by index so the stack reads as paper dropped by
 * hand rather than as a list. The incoming tilt is exaggerated and settles to a
 * slight one, which is what makes the landing look like weight.
 *
 * `translate(-50%, 0)` is part of every pose, not just the landed ones: the
 * cards are absolutely positioned at `left: 50%`, so without it a card extends
 * its full width to the right of centre and gives the page a horizontal
 * scrollbar on a narrow viewport before the loop has written anything.
 */
export const getWorkflowCardPose = (
  index: number,
  hasLanded: boolean,
): WorkflowCardPose => {
  const isOdd = index % 2 === 1
  if (!hasLanded) {
    return {
      transform: `translate(-50%, 0) translateY(${STACK_ENTRY_PX}px) rotate(${
        isOdd ? 7 : -7
      }deg)`,
      opacity: 0,
    }
  }
  return {
    transform: `translate(-50%, 0) translateY(${
      STACK_TOP_PX + index * STACK_STEP_PX
    }px) rotate(${isOdd ? 1.5 : -1.5}deg)`,
    opacity: 1,
  }
}
