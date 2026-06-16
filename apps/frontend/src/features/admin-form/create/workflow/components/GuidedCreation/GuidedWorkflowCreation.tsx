import { Fragment, useEffect, useLayoutEffect, useRef } from 'react'
import { Box, Flex, Stack, useDisclosure } from '@chakra-ui/react'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import {
  editDataSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import {
  completedStepsSelector,
  currentStepIndexSelector,
  guidedModeSelector,
  useGuidedWorkflowStore,
} from '../../guidedWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { DeleteStepModal } from '../DeleteStepModal'
import { ActiveStepBlock } from '../WorkflowContent/ActiveStepBlock'
import { EndOfWorkflowBlock } from '../WorkflowContent/EndOfWorkflowBlock'
import { EndOfWorkflowDivider } from '../WorkflowContent/EndOfWorkflowDivider'
import { InactiveStepBlock } from '../WorkflowContent/InactiveStepBlock'
import { SortableStepList } from '../WorkflowContent/SortableStepList'
import { WorkflowCard } from '../WorkflowContent/WorkflowCard'
import { WorkflowStepBlockDivider } from '../WorkflowContent/WorkflowContent'

import { AddAnotherPrompt } from './AddAnotherPrompt'
import { GuidedEmailCard } from './GuidedEmailCard'
import { GuidedStep } from './GuidedStep'
import { IntroPage } from './IntroPage'
import { PeekCard } from './PeekCard'
import { WorkflowSuccessModal } from './WorkflowSuccessModal'

// For steps 3+ (index >= 2), auto-reveal all sections so users see
// everything at once. They can click "Guide me" to reset to section 1.
const FIRST_STEP_TOTAL_SECTIONS = 3
const LATER_STEP_TOTAL_SECTIONS = 4

export const GuidedWorkflowCreation = (): JSX.Element => {
  const mode = useGuidedWorkflowStore(guidedModeSelector)
  const currentStepIndex = useGuidedWorkflowStore(currentStepIndexSelector)
  const completedSteps = useGuidedWorkflowStore(completedStepsSelector)
  const { formWorkflow } = useAdminFormWorkflow()

  const revealNextSection = useGuidedWorkflowStore((s) => s.revealNextSection)
  const completeEmailSetup = useGuidedWorkflowStore((s) => s.completeEmailSetup)
  const completeWorkflowPeek = useGuidedWorkflowStore(
    (s) => s.completeWorkflowPeek,
  )
  const completeStatusToggle = useGuidedWorkflowStore(
    (s) => s.completeStatusToggle,
  )
  const completeSuccessModal = useGuidedWorkflowStore(
    (s) => s.completeSuccessModal,
  )
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

  const isAnyCardActive = useAdminWorkflowStore(
    (s) => s.createOrEditData !== null,
  )

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
    return (
      <Stack spacing="0">
        <WorkflowCard showSubheader showStatusToggle={false} />
        <Box mt="2.75rem">
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
        </Box>
      </Stack>
    )
  }

  if (mode === 'add_another') {
    return (
      <Stack spacing="0">
        <WorkflowCard showSubheader showStatusToggle={false} />
        <Box mt="2.75rem">
          {editingStepNumber !== undefined && (
            <DeleteStepModal
              isOpen={isDeleteModalOpen}
              onClose={onDeleteModalClose}
              stepNumber={editingStepNumber}
            />
          )}
          {completedStepElements}
          {!isAnyCardActive && (
            <AddAnotherPrompt stepNumber={currentStepIndex} />
          )}
        </Box>
      </Stack>
    )
  }

  // Shared rendering for all steps as inactive blocks
  const allStepElements = formWorkflow?.map((step, i) => {
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
  })

  if (mode === 'email_setup') {
    return (
      <Stack spacing="0">
        <WorkflowCard showSubheader showStatusToggle={false} />
        <Box mt="2.75rem">
          {editingStepNumber !== undefined && (
            <DeleteStepModal
              isOpen={isDeleteModalOpen}
              onClose={onDeleteModalClose}
              stepNumber={editingStepNumber}
            />
          )}
          {allStepElements}
          <EndOfWorkflowDivider />
          <GuidedEmailCard onDone={completeEmailSetup} />
        </Box>
      </Stack>
    )
  }

  if (mode === 'workflow_complete') {
    return (
      <Stack spacing="0">
        <WorkflowCard showSubheader showStatusToggle={false} />
        <Box mt="2.75rem">
          {editingStepNumber !== undefined && (
            <DeleteStepModal
              isOpen={isDeleteModalOpen}
              onClose={onDeleteModalClose}
              stepNumber={editingStepNumber}
            />
          )}
          {allStepElements}
          <EndOfWorkflowBlock />
          {!isAnyCardActive && (
            <PeekCard
              title="You're done setting up the end-of-workflow email! Now learn about some special workflow settings."
              onDone={completeWorkflowPeek}
              doneLabel="Continue"
            />
          )}
        </Box>
      </Stack>
    )
  }

  if (mode === 'status_toggle') {
    return (
      <StatusToggleMode
        allStepElements={allStepElements}
        editingStepNumber={editingStepNumber}
        isDeleteModalOpen={isDeleteModalOpen}
        onDeleteModalClose={onDeleteModalClose}
        onDone={completeStatusToggle}
      />
    )
  }

  if (mode === 'success_modal') {
    return (
      <Stack spacing="0">
        <WorkflowCard />
        <WorkflowSuccessModal isOpen={true} onDone={completeSuccessModal} />
        <Box mt="2.75rem">
          {editingStepNumber !== undefined && (
            <DeleteStepModal
              isOpen={isDeleteModalOpen}
              onClose={onDeleteModalClose}
              stepNumber={editingStepNumber}
            />
          )}
          {formWorkflow?.length ? (
            <SortableStepList
              steps={formWorkflow}
              onDeleteModalOpen={onDeleteModalOpen}
            />
          ) : null}
          {formWorkflow?.length ? <EndOfWorkflowBlock /> : null}
        </Box>
      </Stack>
    )
  }

  // mode === 'normal' — workflow is complete
  return (
    <Stack spacing="0">
      <WorkflowCard />
      <Box mt="2.75rem">
        {editingStepNumber !== undefined && (
          <DeleteStepModal
            isOpen={isDeleteModalOpen}
            onClose={onDeleteModalClose}
            stepNumber={editingStepNumber}
          />
        )}
        {formWorkflow?.length ? (
          <SortableStepList
            steps={formWorkflow}
            onDeleteModalOpen={onDeleteModalOpen}
          />
        ) : null}
        {formWorkflow?.length ? <EndOfWorkflowBlock /> : null}
      </Box>
    </Stack>
  )
}

// Separate component so it can own the scroll-to-top effect
const StatusToggleMode = ({
  allStepElements,
  editingStepNumber,
  isDeleteModalOpen,
  onDeleteModalClose,
  onDone,
}: {
  allStepElements: React.ReactNode
  editingStepNumber: number | undefined
  isDeleteModalOpen: boolean
  onDeleteModalClose: () => void
  onDone: () => void
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    cardRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }, [])

  return (
    <Stack spacing="0">
      <Box ref={cardRef}>
        <WorkflowCard
          showSubheader
          showStatusToggle
          belowToggle={
            <Stack spacing="0.75rem">
              <InlineMessage variant="info">
                Use this to let people who filled up the form view the status of
                their response.
              </InlineMessage>
              <Flex justifyContent="flex-end">
                <Button onClick={onDone}>Done</Button>
              </Flex>
            </Stack>
          }
        />
      </Box>
      <Box mt="2.75rem">
        {editingStepNumber !== undefined && (
          <DeleteStepModal
            isOpen={isDeleteModalOpen}
            onClose={onDeleteModalClose}
            stepNumber={editingStepNumber}
          />
        )}
        {allStepElements}
        <EndOfWorkflowBlock />
      </Box>
    </Stack>
  )
}
