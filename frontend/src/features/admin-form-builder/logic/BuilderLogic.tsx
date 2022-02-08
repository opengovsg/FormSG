import { useMemo } from 'react'
import { BiPlus } from 'react-icons/bi'
import { Container, Flex, Spacer } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { EmptyLogic } from './components/EmptyLogic'
import { LogicContent } from './components/LogicContent'
import { useBuilderLogic } from './BuilderLogicContext'

export const BuilderLogic = (): JSX.Element => {
  const { hasPendingLogic, formLogics } = useBuilderLogic()

  const isEmptyLogic = useMemo(
    () => formLogics?.length === 0 && !hasPendingLogic,
    [formLogics?.length, hasPendingLogic],
  )

  if (!formLogics) {
    // TODO: Some loading skeleton
    return <div>Loading...</div>
  }

  return (
    <Flex flex={1} bg="primary.100" p="3.75rem">
      <Spacer />
      <Container maxW="42.5rem">
        {isEmptyLogic ? <EmptyLogic /> : <LogicContent />}
      </Container>
      <Flex flex={1} pos="relative">
        {!isEmptyLogic && (
          <IconButton
            isDisabled={hasPendingLogic}
            pos="sticky"
            top="1rem"
            icon={<BiPlus fontSize="1/5rem" />}
            aria-label="Add logic"
          />
        )}
      </Flex>
    </Flex>
  )
}
