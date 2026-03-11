import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { ApiError } from '~typings/core'

import { getPaymentGuideLink } from './PaymentSettingsService'

export const usePaymentGuideLink = (): UseQueryResult<string, ApiError> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  // Ideally the query key should be userId as the access to the guide should be
  // based on the user's access to payments. Here, we assume that access to
  // payments across collaborators of a form is the same.
  return useQuery(`guide-payments-${formId}`, () => getPaymentGuideLink())
}
