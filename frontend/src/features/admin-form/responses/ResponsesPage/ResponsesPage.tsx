import { Box } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form'

import { useAdminForm } from '~features/admin-form/common/queries'

import { StorageResponsesTab } from './StorageResponsesTab'

export const ResponsesPage = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!form) {
    return <div>Error retrieving form</div>
  }

  if (form.responseMode === FormResponseMode.Encrypt) {
    return <StorageResponsesTab form={form} />
  }

  return <Box>Responses tab for email mode form</Box>
}
