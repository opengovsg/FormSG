import { FormResponseMode } from '~shared/types/form'

import { useAdminForm } from '~features/admin-form/common/queries'

import { EmailResponsesTab } from './EmailResponsesTab'
import { ResponsesProvider } from './ResponsesProvider'
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
    return (
      <ResponsesProvider>
        <StorageResponsesTab form={form} />
      </ResponsesProvider>
    )
  }

  return <EmailResponsesTab />
}
