import { Fragment } from 'react'
import { Stack } from '@chakra-ui/react'

import {
  completedStepsSelector,
  currentStepIndexSelector,
  guidedModeSelector,
  useGuidedWorkflowStore,
} from '../../guidedWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { InactiveStepBlock } from '../WorkflowContent/InactiveStepBlock'
import { WorkflowStepBlockDivider } from '../WorkflowContent/WorkflowContent'

import { AddAnotherPrompt } from './AddAnotherPrompt'
import { GuidedStep } from './GuidedStep'
import { IntroPage } from './IntroPage'

export const GuidedWorkflowCreation = (): JSX.Element => {
  const mode = useGuidedWorkflowStore(guidedModeSelector)
  const currentStepIndex = useGuidedWorkflowStore(currentStepIndexSelector)
  const completedSteps = useGuidedWorkflowStore(completedStepsSelector)
  const { formWorkflow } = useAdminFormWorkflow()

  if (mode === 'intro') {
    return <IntroPage />
  }

  // Render completed steps from the real workflow data
  const completedStepElements = completedSteps.map((stepIdx) => {
    const step = formWorkflow?.[stepIdx]
    if (!step) return null
    return (
      <Fragment key={stepIdx}>
        {stepIdx > 0 && <WorkflowStepBlockDivider />}
        <InactiveStepBlock stepNumber={stepIdx} step={step} />
      </Fragment>
    )
  })

  if (mode === 'guided_step') {
    return (
      <Stack spacing="0">
        {completedStepElements}
        {completedSteps.length > 0 && <WorkflowStepBlockDivider />}
        <GuidedStep
          stepIndex={currentStepIndex}
          isFirstStep={currentStepIndex === 0}
        />
      </Stack>
    )
  }

  if (mode === 'add_another') {
    return (
      <Stack spacing="0">
        {completedStepElements}
        <AddAnotherPrompt stepNumber={currentStepIndex} />
      </Stack>
    )
  }

  // mode === 'normal' should not reach here, but just in case
  return <></>
}
