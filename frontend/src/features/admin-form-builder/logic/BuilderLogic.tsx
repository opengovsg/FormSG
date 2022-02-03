import { Box } from '@chakra-ui/react'

import { useAdminForm } from '~features/admin-form/common/queries'

import { EmptyLogic } from './components/EmptyLogic'

export const BuilderLogic = (): JSX.Element => {
  const { data: form } = useAdminForm()

  if (!form) {
    // TODO: Some loading skeleton
    return <div>Loading...</div>
  }

  if (form.form_logics.length === 0) {
    return <EmptyLogic />
  }

  return (
    <Box flex={1} bg="primary.100" p="3.75rem" overflowY="auto">
      There is some logic here
    </Box>
  )
}
