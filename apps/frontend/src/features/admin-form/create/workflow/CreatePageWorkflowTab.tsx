import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Box, Container } from '@chakra-ui/react'

import { GuidedWorkflowCreation } from './components/GuidedCreation'
import { WorkflowContent } from './components/WorkflowContent'
import { WorkflowSkeleton } from './components/WorkflowSkeleton'
import { useAdminFormWorkflow } from './hooks/useAdminFormWorkflow'
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

  const guidedMode = useGuidedWorkflowStore(guidedModeSelector)
  const currentStepIndex = useGuidedWorkflowStore(currentStepIndexSelector)
  const resetGuided = useGuidedWorkflowStore((s) => s.reset)

  const isEmptyWorkflow = useMemo(
    () => formWorkflow?.length === 0 && !createOrEditData,
    [createOrEditData, formWorkflow?.length],
  )

  // Show guided when: mode is not 'normal' AND (empty workflow triggers intro, or guided is in progress)
  const showGuided =
    guidedMode !== 'normal' && (isEmptyWorkflow || guidedMode !== 'intro')

  // Reset guided state when it's stale (doesn't match the actual workflow).
  // Case 1: workflow is empty but store thinks we're in 'normal' mode (finished a previous form)
  // Case 2: workflow is empty but store has a non-zero step index (leftover from another form)
  useEffect(() => {
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
      }
    }
  }, [formWorkflow?.length, guidedMode, currentStepIndex, resetGuided])

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
