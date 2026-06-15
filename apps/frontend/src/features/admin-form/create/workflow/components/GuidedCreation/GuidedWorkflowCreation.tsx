import { Fragment, useEffect, useRef } from 'react'
import { Stack, useDisclosure } from '@chakra-ui/react'

import {
  editDataSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import {
  completedStepsSelector,
  currentSectionSelector,
  currentStepIndexSelector,
  guidedModeSelector,
  useGuidedWorkflowStore,
} from '../../guidedWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { DeleteStepModal } from '../DeleteStepModal'
import { ActiveEmailCard } from '../WorkflowContent/ActiveEmailCard'
import { ActiveStepBlock } from '../WorkflowContent/ActiveStepBlock'
import { EndOfWorkflowBlock } from '../WorkflowContent/EndOfWorkflowBlock'
import { EndOfWorkflowDivider } from '../WorkflowContent/EndOfWorkflowDivider'
import { InactiveStepBlock } from '../WorkflowContent/InactiveStepBlock'
import { WorkflowStepBlockDivider } from '../WorkflowContent/WorkflowContent'

import { AddAnotherPrompt } from './AddAnotherPrompt'
import { GuidedStep } from './GuidedStep'
import { IntroPage } from './IntroPage'

// For steps 3+ (index >= 2), auto-reveal all sections so users see
// everything at once. They can click "Guide me" to reset to section 1.
const FIRST_STEP_TOTAL_SECTIONS = 3
const LATER_STEP_TOTAL_SECTIONS = 4

export const GuidedWorkflowCreation = (): JSX.Element => {
  const mode = useGuidedWorkflowStore(guidedModeSelector)
  const currentStepIndex = useGuidedWorkflowStore(currentStepIndexSelector)
  const currentSection = useGuidedWorkflowStore(currentSectionSelector)
  const completedSteps = useGuidedWorkflowStore(completedStepsSelector)
  const { formWorkflow } = useAdminFormWorkflow()

  const revealNextSection = useGuidedWorkflowStore((s) => s.revealNextSection)
  const finishWorkflow = useGuidedWorkflowStore((s) => s.finishWorkflow)
  const editState = useAdminWorkflowStore(editDataSelector)
  const {
    isOpen: isDeleteModalOpen,
    onClose: onDeleteModalClose,
    onOpen: onDeleteModalOpen,
  } = useDisclosure()

  // Track the previous stepIndex so we can auto-reveal when entering step 3+.
  const prevStepIndexRef = useRef(currentStepIndex)
  useEffect(() => {
    if (
      mode === 'guided_step' &&
      currentStepIndex >= 2 &&
      currentStepIndex !== prevStepIndexRef.current
    ) {
      // Auto-reveal all sections for steps 3+
      const totalSections =
        currentStepIndex === 0
          ? FIRST_STEP_TOTAL_SECTIONS
          : LATER_STEP_TOTAL_SECTIONS
      // Bump currentSection to totalSections so all blocks are visible
      const sectionsToReveal = totalSections - 1 // currentSection starts at 1
      for (let i = 0; i < sectionsToReveal; i++) {
        revealNextSection()
      }
    }
    prevStepIndexRef.current = currentStepIndex
  }, [currentStepIndex, mode, revealNextSection])

  if (mode === 'intro') {
    return <IntroPage />
  }

  const editingStepNumber = editState?.stepNumber

  // Render completed steps from the real workflow data
  const completedStepElements = completedSteps.map((stepIdx) => {
    const step = formWorkflow?.[stepIdx]
    if (!step) return null
    const isEditing = editState?.stepNumber === stepIdx
    return (
      <Fragment key={stepIdx}>
        {stepIdx > 0 && <WorkflowStepBlockDivider />}
        {isEditing ? (
          <ActiveStepBlock
            stepNumber={stepIdx}
            step={step}
            handleOpenDeleteModal={onDeleteModalOpen}
          />
        ) : (
          <InactiveStepBlock stepNumber={stepIdx} step={step} />
        )}
      </Fragment>
    )
  })

  if (mode === 'guided_step') {
    const isLaterStep = currentStepIndex >= 2
    const totalSections =
      currentStepIndex === 0
        ? FIRST_STEP_TOTAL_SECTIONS
        : LATER_STEP_TOTAL_SECTIONS
    const allSectionsRevealed = currentSection >= totalSections

    return (
      <Stack spacing="0">
        {editingStepNumber !== undefined && (
          <DeleteStepModal
            isOpen={isDeleteModalOpen}
            onClose={onDeleteModalClose}
            stepNumber={editingStepNumber}
          />
        )}
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
        {editingStepNumber !== undefined && (
          <DeleteStepModal
            isOpen={isDeleteModalOpen}
            onClose={onDeleteModalClose}
            stepNumber={editingStepNumber}
          />
        )}
        {completedStepElements}
        <AddAnotherPrompt stepNumber={currentStepIndex} />
      </Stack>
    )
  }

  if (mode === 'email_setup') {
    return (
      <Stack spacing="0">
        {editingStepNumber !== undefined && (
          <DeleteStepModal
            isOpen={isDeleteModalOpen}
            onClose={onDeleteModalClose}
            stepNumber={editingStepNumber}
          />
        )}
        {formWorkflow?.map((step, i) => {
          const isEditing = editState?.stepNumber === i
          return (
            <Fragment key={i}>
              {i > 0 && <WorkflowStepBlockDivider />}
              {isEditing ? (
                <ActiveStepBlock
                  stepNumber={i}
                  step={step}
                  handleOpenDeleteModal={onDeleteModalOpen}
                />
              ) : (
                <InactiveStepBlock stepNumber={i} step={step} />
              )}
            </Fragment>
          )
        })}
        <EndOfWorkflowDivider />
        <ActiveEmailCard onDone={finishWorkflow} />
      </Stack>
    )
  }

  // mode === 'normal' — workflow is complete, show all steps + end of workflow
  return (
    <Stack spacing="0">
      {editingStepNumber !== undefined && (
        <DeleteStepModal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
          stepNumber={editingStepNumber}
        />
      )}
      {formWorkflow?.map((step, i) => {
        const isEditing = editState?.stepNumber === i
        return (
          <Fragment key={i}>
            {i > 0 && <WorkflowStepBlockDivider />}
            {isEditing ? (
              <ActiveStepBlock
                stepNumber={i}
                step={step}
                handleOpenDeleteModal={onDeleteModalOpen}
              />
            ) : (
              <InactiveStepBlock stepNumber={i} step={step} />
            )}
          </Fragment>
        )
      })}
      {formWorkflow?.length ? <EndOfWorkflowBlock /> : null}
    </Stack>
  )
}
