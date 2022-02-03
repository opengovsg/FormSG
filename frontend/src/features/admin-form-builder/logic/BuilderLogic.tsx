import { useMemo } from 'react'
import { Box, Container } from '@chakra-ui/react'

import { useAdminForm } from '~features/admin-form/common/queries'

import { EmptyLogic } from './components/EmptyLogic'
import { LogicContent } from './components/LogicContent'
import { useBuilderLogic } from './BuilderLogicContext'

export const BuilderLogic = (): JSX.Element => {
  const { data: form } = useAdminForm()
  const { hasPendingLogic } = useBuilderLogic()

  const isEmptyLogic = useMemo(
    () => form?.form_logics.length === 0 && !hasPendingLogic,
    [form?.form_logics.length, hasPendingLogic],
  )

  if (!form) {
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
