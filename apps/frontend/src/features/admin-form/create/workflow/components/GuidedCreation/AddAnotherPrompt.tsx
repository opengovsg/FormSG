import { useGuidedWorkflowStore } from '../../guidedWorkflowStore'

import { PeekCard } from './PeekCard'

interface AddAnotherPromptProps {
  stepNumber: number
}

/**
 * The peek card for the first two completion moments: a saved step 1, and any
 * saved step after it.
 *
 * Step 1 gets its own wording because it is the only step whose respondents the
 * admin does not choose.
 */
export const AddAnotherPrompt = ({
  stepNumber,
}: AddAnotherPromptProps): JSX.Element => {
  const addAnotherStep = useGuidedWorkflowStore((state) => state.addAnotherStep)
  const startEmailSetup = useGuidedWorkflowStore(
    (state) => state.startEmailSetup,
  )

  const isFirstStep = stepNumber === 0

  return (
    <PeekCard
      title={
        isFirstStep
          ? 'Step 1 is the public-facing step. Anyone with your link starts here.'
          : `Nice, Step ${stepNumber + 1} is all set`
      }
      subtitle={
        isFirstStep
          ? 'Now add the steps that route to specific people.'
          : 'Would you like to add another step?'
      }
      actions={[
        { label: "No, I'm done", onClick: startEmailSetup },
        { label: 'Yes, add a step', onClick: addAnotherStep },
      ]}
    />
  )
}
