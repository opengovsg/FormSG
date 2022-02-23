import { useMemo } from 'react'
import { BiPlus } from 'react-icons/bi'
import { Box, Container, Flex, Spacer } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { EmptyLogic } from './components/EmptyLogic'
import { LogicContent } from './components/LogicContent'
import { useBuilderLogic } from './BuilderLogicContext'

export const CreatePageLogicTab = (): JSX.Element => {
  const { hasPendingLogic, formLogics, handleSetHasPendingLogic } =
    useBuilderLogic()

  const isEmptyLogic = useMemo(
    () => formLogics?.length === 0 && !hasPendingLogic,
    [formLogics?.length, hasPendingLogic],
  )

  if (!formLogics) {
    // TODO: Some loading skeleton
    return <div>Loading...</div>
  }

  return (
    <Box flex={1} h="fit-content" bg="primary.100">
      <Flex p={{ base: '0.5rem', md: '3.75rem' }}>
        <Spacer />
        <Container maxW="42.5rem">
          {isEmptyLogic ? <EmptyLogic /> : <LogicContent />}
        </Container>
        <Flex flex={1} pos="relative">
          {!isEmptyLogic && !hasPendingLogic && (
            <IconButton
              zIndex="docked"
              isDisabled={hasPendingLogic}
              pos={{ base: 'fixed', md: 'sticky' }}
              top={{ md: '1rem' }}
              bottom={{ base: '5rem', md: undefined }}
              right={{ base: '1rem', md: undefined }}
              icon={<BiPlus fontSize="1.5rem" />}
              aria-label="Add logic"
              onClick={() => handleSetHasPendingLogic(true)}
            />
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
