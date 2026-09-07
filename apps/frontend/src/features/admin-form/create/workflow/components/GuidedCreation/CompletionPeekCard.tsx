import { useTranslation } from 'react-i18next'

import { useAdminWorkflowStore } from '../../adminWorkflowStore'
import { useIsWorkflowBuilderRedesign } from '../../hooks/useIsWorkflowBuilderRedesign'

import {
  CompletionPeekMomentType,
  getCompletionPeekActionLabels,
  getCompletionPeekContent,
  isCompletionPeekTucked,
} from './utils/completionPeekContent'
import { PeekCard, PeekCardActions } from './PeekCard'

/**
 * A moment plus the callbacks its actions need.
 *
 * One union member per moment, each carrying exactly the callbacks that moment
 * offers, so a caller cannot supply the wrong ones or omit one. The two-step
 * moments need two callbacks, which is why an action cannot be a single
 * `onDone`.
 */
export type CompletionPeekCardProps =
  | {
      type: CompletionPeekMomentType.StepOneDone
      onDeclineAnotherStep: () => void
      onAddAnotherStep: () => void
    }
  | {
      type: CompletionPeekMomentType.LaterStepDone
      /**
       * Zero-based, and named `stepNumber` rather than `stepIndex` to match
       * the rest of the builder: `adminWorkflowStore`'s
       * `setToEditing(stepNumber)`, `isFirstStepByStepNumber` and
       * `WorkflowContent`'s `stepNumber={i}` all count from zero. Rendered as
       * +1, so 1 reads "Step 2".
       */
      stepNumber: number
      onDeclineAnotherStep: () => void
      onAddAnotherStep: () => void
    }
  | {
      type: CompletionPeekMomentType.EmailSetUp
      onContinue: () => void
    }
  | {
      type: CompletionPeekMomentType.StatusTracking
      onFinish: () => void
    }
  | {
      type: CompletionPeekMomentType.GuidedSetupFinished
      onFinish: () => void
    }

/**
 * A peek card for one of the guided flow's completion moments, wired to its
 * copy and its actions.
 *
 * Owns the two conditions under which no peek card should appear at all, rather
 * than leaving them to five call sites that could each forget one:
 *
 * - Behind `workflow-builder-redesign`. No exceptions; this is live for the
 *   whole Singapore government.
 * - Hidden while any step or email card is open for editing. A peek card
 *   reports on a finished card, and while the admin is editing, nothing is
 *   finished.
 */
export const CompletionPeekCard = (
  props: CompletionPeekCardProps,
): JSX.Element | null => {
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  // One check rather than one per card type: an open card is an open card. The
  // completion email card of FRM-2495 becomes a third variant of
  // createOrEditData rather than separate state, so it is covered here the day
  // it lands, with nothing to add.
  const isAnyCardOpen = useAdminWorkflowStore(
    (state) => state.createOrEditData !== null,
  )

  if (!isRedesign || isAnyCardOpen) return null

  const { title, subtitle } = getCompletionPeekContent(t, props)
  const labels = getCompletionPeekActionLabels(t)

  // Adding a moment without giving it actions is a compile error rather than
  // an empty button row. The `never` assignment in the default branch is what
  // makes that so, rather than the absence of a default: a fallthrough on an
  // annotated return type only errors under noImplicitReturns, which is a
  // config away from being the guarantee this comment claims.
  const actions = ((): PeekCardActions => {
    switch (props.type) {
      case CompletionPeekMomentType.StepOneDone:
      case CompletionPeekMomentType.LaterStepDone:
        return [
          {
            label: labels.declineAnotherStep,
            onClick: props.onDeclineAnotherStep,
          },
          { label: labels.addAnotherStep, onClick: props.onAddAnotherStep },
        ]
      case CompletionPeekMomentType.EmailSetUp:
        return [{ label: labels.continue, onClick: props.onContinue }]
      case CompletionPeekMomentType.StatusTracking:
      case CompletionPeekMomentType.GuidedSetupFinished:
        return [{ label: labels.finish, onClick: props.onFinish }]
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = props
        throw new Error('Unhandled completion peek moment.')
      }
    }
  })()

  return (
    <PeekCard
      title={title}
      subtitle={subtitle}
      actions={actions}
      isTucked={isCompletionPeekTucked(props)}
    />
  )
}
