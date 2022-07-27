import { FormResponseMode } from '~shared/types/form'

import { useAdminForm } from '~features/admin-form/common/queries'

import { StorageResponsesTab } from './storage/StorageResponsesTab'
import { EmailResponsesTab } from './email'

export const ResponsesPage = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!form) {
    return <div>Error retrieving form</div>
  }

  if (form.responseMode === FormResponseMode.Encrypt) {
    return <StorageResponsesTab />
  }

  return <EmailResponsesTab />
}

export default ResponsesPage
