import { useToast } from '@opengovsg/design-system-react'

import { FormResponseMode } from '~shared/types/form'

import { useAdminForm } from '~features/admin-form/common/queries'

import { EmailResponsesTab } from './email'
import { ResponsesPageSkeleton } from './ResponsesPageSkeleton'
import { StorageResponsesTab } from './storage'

export const ResponsesPage = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()

  const toast = useToast({ status: 'error' })

  if (isLoading) return <ResponsesPageSkeleton />

  if (!form) {
    toast({
      description:
        'There was an error retrieving your form. Please try again later.',
    })
    return <ResponsesPageSkeleton />
  }

  if (form.responseMode === FormResponseMode.Email) {
    return <EmailResponsesTab />
  }

  return <StorageResponsesTab />
}
