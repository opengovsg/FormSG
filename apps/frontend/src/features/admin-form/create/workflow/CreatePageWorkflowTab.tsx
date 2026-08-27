import { useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Container } from '@chakra-ui/react'

import { GuidedWorkflowCreation } from './components/GuidedCreation'
import { WorkflowContent } from './components/WorkflowContent'
import { WorkflowSkeleton } from './components/WorkflowSkeleton'
import { useAdminFormWorkflow } from './hooks/useAdminFormWorkflow'
import { getWorkflowCompletionStatus } from './utils/getWorkflowCompletionStatus'
import { useAdminWorkflowStore } from './adminWorkflowStore'
import {
  currentStepIndexSelector,
  guidedModeSelector,
  useGuidedWorkflowStore,
} from './guidedWorkflowStore'

export const CreatePageWorkflowTab = (): JSX.Element => {
  const { createOrEditData, reset } = useAdminWorkflowStore(
    useCallback((state) => {
      return {
        createOrEditData: state.createOrEditData,
        setToCreating: state.setToCreating,
        reset: state.reset,
      }
    }, []),
  )
  const { isLoading, formWorkflow } = useAdminFormWorkflow()
  const { formId } = useParams()

  const guidedMode = useGuidedWorkflowStore(guidedModeSelector)
  const currentStepIndex = useGuidedWorkflowStore(currentStepIndexSelector)
  const storedFormId = useGuidedWorkflowStore((s) => s.formId)
  const resetGuided = useGuidedWorkflowStore((s) => s.reset)
  const setGuidedFormId = useGuidedWorkflowStore((s) => s.setFormId)
  const finishWorkflow = useGuidedWorkflowStore((s) => s.finishWorkflow)
  const resumeAtIncompleteSection = useGuidedWorkflowStore(
    (s) => s.resumeAtIncompleteSection,
  )

  const isEmptyWorkflow = useMemo(
    () => formWorkflow?.length === 0 && !createOrEditData,
    [createOrEditData, formWorkflow?.length],
  )

  // Show guided when: mode is not 'normal' AND (empty workflow triggers intro, or guided is in progress)
  const showGuided =
    guidedMode !== 'normal' && (isEmptyWorkflow || guidedMode !== 'intro')

  // Reset guided state when the form changes or state is stale.
  useEffect(() => {
    if (!formId) return

    // Different form than what the guided store was tracking: reset.
    if (storedFormId && storedFormId !== formId) {
      if (formWorkflow && formWorkflow.length > 0) {
        // The form already has steps. Rather than restarting the flow or
        // dropping the admin into the normal editor, pick up at the first
        // section they have not finished.
        const { firstIncompleteStepIndex, firstIncompleteSection } =
          getWorkflowCompletionStatus(formWorkflow)
        if (
          firstIncompleteStepIndex !== null &&
          (firstIncompleteSection === 'respondent' ||
            firstIncompleteSection === 'fields')
        ) {
          resumeAtIncompleteSection(
            firstIncompleteStepIndex,
            firstIncompleteSection,
          )
        } else {
          // Nothing left to finish, so there is nothing to guide.
          finishWorkflow()
        }
      } else {
        // Empty form, show intro
        resetGuided()
      }
      setGuidedFormId(formId)
      return
    }

    // Same form (or first visit): stamp the formId
    if (!storedFormId) {
      setGuidedFormId(formId)
    }

    // Legacy reset logic for empty workflows with stale state
    if (formWorkflow?.length === 0) {
      if (
        guidedMode === 'normal' ||
        guidedMode === 'email_setup' ||
        guidedMode === 'workflow_complete' ||
        guidedMode === 'status_toggle' ||
        guidedMode === 'success_modal' ||
        currentStepIndex > 0
      ) {
        resetGuided()
        setGuidedFormId(formId)
      }
    }
  }, [
    formId,
    storedFormId,
    formWorkflow,
    formWorkflow?.length,
    guidedMode,
    currentStepIndex,
    resetGuided,
    finishWorkflow,
    setGuidedFormId,
    resumeAtIncompleteSection,
  ])

  useEffect(() => reset, [reset])

  if (isLoading) return <WorkflowSkeleton />

  return (
    <Box
      flex={1}
      /**
       * HACK: Chromium browsers have a bug where sibling elements with `position: sticky` will not
       * be correctly calculated during a reflow. This causes the sibling to not have the correct
       * y-axis position.
       *
       * Setting the `position` to `sticky` or `relative` would workaround this issue. We're choosing
       * not to use `sticky` since it has more side effects and gotchas.
       */
      position="relative"
      overflow="auto"
      bg="neutral.100"
      pt={{ base: '2rem', md: '1rem' }}
      pb={{ base: '6rem', md: '5rem' }}
      px={{ base: '1.5rem', md: '3.75rem' }}
    >
      <Container p={0} maxW="42.5rem">
        {showGuided ? <GuidedWorkflowCreation /> : <WorkflowContent />}
      </Container>
    </Box>
  )
}
