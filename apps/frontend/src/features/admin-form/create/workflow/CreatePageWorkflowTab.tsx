import { useCallback, useEffect, useMemo } from 'react'

import { Box, Container } from '@chakra-ui/react'

import { useSidebarWidth } from '../common/CreatePageSidebarContext'
import { useAdminWorkflowStore } from './adminWorkflowStore'
import { EmptyWorkflow } from './components/EmptyWorkflow'
import { WelcomeCard } from './components/GuidedCreation'
import { WorkflowContent } from './components/WorkflowContent'
import { WorkflowSkeleton } from './components/WorkflowSkeleton'
import { useAdminFormWorkflow } from './hooks/useAdminFormWorkflow'

export const CreatePageWorkflowTab = (): JSX.Element => {
  const {
    createOrEditData,
    isOnWelcomeCard,
    reset,
    stepDraft,
    restoreStepDraft,
  } = useAdminWorkflowStore(
    useCallback((state) => {
      return {
        createOrEditData: state.createOrEditData,
        isOnWelcomeCard: state.isOnWelcomeCard,
        setToCreating: state.setToCreating,
        reset: state.reset,
        stepDraft: state.stepDraft,
        restoreStepDraft: state.restoreStepDraft,
      }
    }, []),
  )
  const { isLoading, formWorkflow } = useAdminFormWorkflow()
  const sidebarWidth = useSidebarWidth()

  const isEmptyWorkflow = useMemo(
    () => formWorkflow?.length === 0 && !createOrEditData && !stepDraft,
    [createOrEditData, formWorkflow?.length, stepDraft],
  )

  useEffect(() => reset, [reset])

  useEffect(() => restoreStepDraft(), [restoreStepDraft])

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
      pr={{ base: '1.5rem', md: `calc(3.75rem + ${sidebarWidth}px)` }}
    >
      <Container p={0} maxW="42.5rem">
        {isOnWelcomeCard ? (
          <WelcomeCard />
        ) : isEmptyWorkflow ? (
          <EmptyWorkflow />
        ) : (
          <WorkflowContent />
        )}
      </Container>
    </Box>
  )
}
