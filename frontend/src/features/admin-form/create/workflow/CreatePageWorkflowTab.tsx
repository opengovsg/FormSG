import { useCallback, useEffect, useMemo } from 'react'
import { Box, Container } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'

import { EmptyWorkflow } from './components/EmptyWorkflow'
import { WorkflowContent } from './components/WorkflowContent'
import { WorkflowSkeleton } from './components/WorkflowSkeleton'
import { useAdminFormWorkflow } from './hooks/useAdminFormWorkflow'
import { useAdminWorkflowStore } from './adminWorkflowStore'
import { WorkflowDrawerWrapper } from './components/WorkflowDrawer/WorkflowDrawerWrapper'
import { useCreatePageSidebar } from '../common/CreatePageSidebarContext'

export const CreatePageWorkflowTab = (): JSX.Element => {
  const isMobile = useIsMobile()
  const { isDrawerOpen } = useCreatePageSidebar()

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

  const isEmptyWorkflow = useMemo(
    () => formWorkflow?.length === 0 && !createOrEditData,
    [createOrEditData, formWorkflow?.length],
  )

  useEffect(() => reset, [reset])

  if (isLoading) return <WorkflowSkeleton />
  return (
    <>
      <WorkflowDrawerWrapper />{' '}
      {!(isMobile && isDrawerOpen) && (
        <Box
          flex={1}
          position="relative"
          overflow="auto"
          bg="neutral.100"
          py={{ base: '2rem', md: '1rem' }}
          px={{ base: '1.5rem', md: '3.75rem' }}
        >
          <Container p={0} maxW="42.5rem">
            {isEmptyWorkflow ? <EmptyWorkflow /> : <WorkflowContent />}
          </Container>
        </Box>
      )}
    </>
  )
}
