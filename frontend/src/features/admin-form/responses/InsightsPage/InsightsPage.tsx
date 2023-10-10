import { FormResponseMode } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'

import { EmptyResponses } from '../ResponsesPage/common/EmptyResponses'
import { ResponsesPageSkeleton } from '../ResponsesPage/ResponsesPageSkeleton'
import {
  SecretKeyVerification,
  useStorageResponsesContext,
} from '../ResponsesPage/storage'

import { useAllSubmissionData } from './queries'

export const InsightsPage = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()

  const toast = useToast({ status: 'danger' })

  if (isLoading) return <ResponsesPageSkeleton />

  if (!form) {
    toast({
      description:
        'There was an error retrieving your form. Please try again later.',
    })
    return <ResponsesPageSkeleton />
  }

  if (form.responseMode === FormResponseMode.Email) {
    return <></>
  }

  if (totalResponsesCount === 0) {
    return <EmptyResponses />
  }

  return secretKey ? <InternalInsights /> : <SecretKeyVerification />
}

const InternalInsights = () => {
  const { data } = useAllSubmissionData()
  console.log(data)

  const { data: form } = useAdminForm()
  console.log(form?.form_fields)

  // For each form field in form
  // Aggregate submission data based on _id
  // Render into react google charts

  return <></>
}
