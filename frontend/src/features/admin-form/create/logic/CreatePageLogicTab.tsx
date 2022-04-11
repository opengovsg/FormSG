import { useCallback, useEffect, useMemo } from 'react'
import { BiPlus } from 'react-icons/bi'
import { Box, Container, Flex, Spacer } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { EmptyLogic } from './components/EmptyLogic'
import { LogicContent } from './components/LogicContent'
import { useAdminFormLogic } from './hooks/useAdminFormLogic'
import { useAdminLogicStore } from './adminLogicStore'
import { AdminEditLogicState } from './types'

export const CreatePageLogicTab = (): JSX.Element => {
  const { createOrEditData, setToCreating, reset, isCreatingLogic } =
    useAdminLogicStore(
      useCallback((state) => {
        return {
          createOrEditData: state.createOrEditData,
          setToCreating: state.setToCreating,
          reset: state.reset,
          isCreatingLogic:
            state.createOrEditData?.state === AdminEditLogicState.CreatingLogic,
        }
      }, []),
    )
  const { isLoading, formLogics } = useAdminFormLogic()

  const isEmptyLogic = useMemo(
    () => formLogics?.length === 0 && !createOrEditData,
    [createOrEditData, formLogics?.length],
  )

  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  if (isLoading) {
    // TODO: Some loading skeleton
    return <div>Loading...</div>
  }

  return (
    <Box flex={1} overflow="auto" bg="primary.100">
      <Flex
        py={{ base: '2rem', md: '1rem' }}
        px={{ base: '1.5rem', md: '3.75rem' }}
      >
        <Spacer />
        <Container p={0} maxW="42.5rem">
          {isEmptyLogic ? <EmptyLogic /> : <LogicContent />}
        </Container>
        <Flex flex={1} pos="relative">
          {!isEmptyLogic && !isCreatingLogic && (
            <IconButton
              zIndex="docked"
              pos={{ base: 'fixed', md: 'sticky' }}
              top={{ md: '1rem' }}
              ml="1rem"
              bottom={{ base: '5rem', md: undefined }}
              right={{ base: '1rem', md: undefined }}
              icon={<BiPlus fontSize="1.5rem" />}
              aria-label="Add logic"
              onClick={setToCreating}
            />
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
