import { useMemo } from 'react'
import { Box, Container } from '@chakra-ui/react'

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
    <Box flex={1} bg="primary.100" p="3.75rem" overflowY="auto">
      <Container maxW="42.5rem">
        {isEmptyLogic ? <EmptyLogic /> : <LogicContent />}
      </Container>
    </Box>
  )
}
