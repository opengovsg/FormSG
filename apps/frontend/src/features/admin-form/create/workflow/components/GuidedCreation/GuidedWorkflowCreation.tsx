import { Fragment, useEffect, useLayoutEffect, useRef } from 'react'
import { Box, Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'

import Button from '~components/Button'

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
import { useMarkGuidedSetupTaught } from '../../utils/useGuidedSetupAudience'
import { DeleteStepModal } from '../DeleteStepModal'
import { EmptyWorkflow } from '../EmptyWorkflow'
import { FadeInUp } from '../FadeInUp'
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
import { PeekCard } from './PeekCard'
import { SkipGuidanceModal } from './SkipGuidanceModal'
import { WelcomePage } from './WelcomePage'

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
  const finishWorkflow = useGuidedWorkflowStore((s) => s.finishWorkflow)
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
  const {
    isOpen: isSkipModalOpen,
    onClose: onSkipModalClose,
    onOpen: onSkipModalOpen,
  } = useDisclosure()

  const markTaught = useMarkGuidedSetupTaught()

  // The flag is written on completion or on skip, never on sight. Skipping
  // counts because it is an explicit "I do not need this", so guidance does not
  // return on the next form.
  const handleSkipConfirm = () => {
    onSkipModalClose()
    markTaught()
    finishWorkflow()
  }

  const handleCompleteSuccessModal = () => {
    markTaught()
    completeSuccessModal()
  }

  // Every guided screen carries the exit except the two where it makes no
  // sense: the flow is over, or guidance has not started. The welcome card has
  // its own placement below the primary action rather than in a card header.
  const showSkipGuidance =
    mode !== 'intro' &&
    mode !== 'welcome' &&
    mode !== 'success_modal' &&
    mode !== 'normal'

  const skipGuidanceButton = showSkipGuidance ? (
    <Button variant="clear" size="md" onClick={onSkipModalOpen}>
      Skip guidance
    </Button>
  ) : undefined

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

  const renderMode = (): JSX.Element => {
    if (mode === 'intro') {
      return <EmptyWorkflow />
    }

    if (mode === 'welcome') {
      return <WelcomePage onSkipGuidance={onSkipModalOpen} />
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
      // Only the arrival from the welcome card animates in. Later returns to a
      // guided step are ordinary navigation, not a handover.
      const isWelcomeHandover =
        currentStepIndex === 0 && completedSteps.length === 0

      const guidedStepContent = (
        <Stack spacing="0">
          <WorkflowCard
            title="Guided workflow setup"
            showStatusToggle={false}
            headerRight={skipGuidanceButton}
          />
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

      return isWelcomeHandover ? (
        <FadeInUp duration={0.2}>{guidedStepContent}</FadeInUp>
      ) : (
        guidedStepContent
      )
    }

    if (mode === 'add_another') {
      return (
        <Stack spacing="0">
          <WorkflowCard
            title="Guided workflow setup"
            showStatusToggle={false}
            headerRight={skipGuidanceButton}
          />
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
          <WorkflowCard
            title="Guided workflow setup"
            showStatusToggle={false}
            headerRight={skipGuidanceButton}
          />
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
          <WorkflowCard
            title="Guided workflow setup"
            showStatusToggle={false}
            headerRight={skipGuidanceButton}
          />
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
                title="You've set up the completion email."
                subtitle="Next, set up an extra workflow setting."
                actions={[{ label: 'Continue', onClick: completeWorkflowPeek }]}
                isTucked={false}
              />
            )}
          </Box>
        </Stack>
      )
    }

    if (mode === 'status_toggle') {
      return (
        <>
          <StatusToggleMode
            allStepElements={allStepElements}
            editingStepNumber={editingStepNumber}
            isDeleteModalOpen={isDeleteModalOpen}
            onDeleteModalClose={onDeleteModalClose}
            onDone={completeStatusToggle}
            skipGuidanceButton={skipGuidanceButton}
            isAnyCardActive={isAnyCardActive}
          />
        </>
      )
    }

    if (mode === 'success_modal') {
      return (
        <SuccessCompletionMode
          formWorkflow={formWorkflow}
          completeSuccessModal={handleCompleteSuccessModal}
          editingStepNumber={editingStepNumber}
          isDeleteModalOpen={isDeleteModalOpen}
          onDeleteModalClose={onDeleteModalClose}
          onDeleteModalOpen={onDeleteModalOpen}
          isAnyCardActive={isAnyCardActive}
        />
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

  return (
    <>
      <SkipGuidanceModal
        isOpen={isSkipModalOpen}
        onClose={onSkipModalClose}
        onConfirm={handleSkipConfirm}
        hasSteps={Boolean(formWorkflow?.length)}
      />
      {renderMode()}
    </>
  )
}

// Separate component so it can own the scroll-to-top effect
const StatusToggleMode = ({
  allStepElements,
  editingStepNumber,
  isDeleteModalOpen,
  onDeleteModalClose,
  onDone,
  skipGuidanceButton,
  isAnyCardActive,
}: {
  allStepElements: React.ReactNode
  editingStepNumber: number | undefined
  isDeleteModalOpen: boolean
  onDeleteModalClose: () => void
  onDone: () => void
  skipGuidanceButton?: React.ReactNode
  isAnyCardActive: boolean
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
      <Box ref={cardRef} position="relative" zIndex={1}>
        <WorkflowCard
          title="Guided workflow setup"
          showStatusToggle
          spotlightToggle
          headerRight={skipGuidanceButton}
        />
      </Box>
      {!isAnyCardActive && (
        <PeekCard
          title="Your workflow is ready"
          subtitle="Before you finish, you can let people check the status of their response."
          actions={[{ label: 'Done', onClick: onDone }]}
        />
      )}
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

// Separate component so confetti fires once on mount
const SuccessCompletionMode = ({
  formWorkflow,
  completeSuccessModal,
  editingStepNumber,
  isDeleteModalOpen,
  onDeleteModalClose,
  onDeleteModalOpen,
  isAnyCardActive,
}: {
  formWorkflow: ReturnType<typeof useAdminFormWorkflow>['formWorkflow']
  completeSuccessModal: () => void
  editingStepNumber: number | undefined
  isDeleteModalOpen: boolean
  onDeleteModalClose: () => void
  onDeleteModalOpen: (stepNumber?: number) => void
  isAnyCardActive: boolean
}) => {
  return (
    <Stack spacing="0">
      <Box position="relative" zIndex={1}>
        <WorkflowCard />
      </Box>
      {!isAnyCardActive && (
        <PeekCard
          title="You've finished guided setup"
          subtitle="Use the Preview button on the top right to check what each step looks like."
          actions={[{ label: 'Done', onClick: completeSuccessModal }]}
        />
      )}
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
