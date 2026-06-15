import { useCallback, useEffect, useMemo } from 'react'
import { Box, Container } from '@chakra-ui/react'

import { GuidedWorkflowCreation } from './components/GuidedCreation'
import { WorkflowContent } from './components/WorkflowContent'
import { WorkflowSkeleton } from './components/WorkflowSkeleton'
import { useAdminFormWorkflow } from './hooks/useAdminFormWorkflow'
import { useAdminWorkflowStore } from './adminWorkflowStore'
import {
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
  const resetGuided = useGuidedWorkflowStore((s) => s.reset)

  const isEmptyWorkflow = useMemo(
    () => formWorkflow?.length === 0 && !createOrEditData,
    [createOrEditData, formWorkflow?.length],
  )

  // Show guided when: mode is not 'normal' AND (empty workflow triggers intro, or guided is in progress)
  const showGuided =
    guidedMode !== 'normal' && (isEmptyWorkflow || guidedMode !== 'intro')

  // Reset guided state when workflow is externally emptied (all steps deleted)
  useEffect(() => {
    if (formWorkflow?.length === 0 && guidedMode === 'normal') {
      resetGuided()
    }
  }, [formWorkflow?.length, guidedMode, resetGuided])

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
      py={{ base: '2rem', md: '1rem' }}
      px={{ base: '1.5rem', md: '3.75rem' }}
    >
      <Container p={0} maxW="42.5rem">
        {showGuided ? <GuidedWorkflowCreation /> : <WorkflowContent />}
      </Container>
    </Box>
  )
}
