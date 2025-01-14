import { useState } from 'react'
import { QueryClient, useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormSettings } from '~shared/types/form/form'
import { EncryptedStringsMessageContent } from '~shared/utils/crypto'

import { adminFormKeys } from '../common/queries'

import {
  getFormEncryptedWhitelistedSubmitterIds,
  getFormSettings,
  validateStripeAccount,
} from './SettingsService'

export const adminFormSettingsKeys = {
  base: [...adminFormKeys.base, 'settings'] as const,
  id: (id: string) => [...adminFormSettingsKeys.base, id] as const,
  payment_channel: (id: string) =>
    [...adminFormSettingsKeys.id(id), 'payment_channel'] as const,
  payment_field: (id: string) =>
    [...adminFormSettingsKeys.id(id), 'payment_field'] as const,
  whitelist: (id: string) =>
    [...adminFormSettingsKeys.id(id), 'whitelist'] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useAdminFormSettings = (): UseQueryResult<FormSettings> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(
    adminFormSettingsKeys.id(formId),
    () => getFormSettings(formId),
    { staleTime: 0 },
  )
}

export const fetchAdminFormEncryptedWhitelistedSubmitterIds = (
  formId: string,
  queryClient: QueryClient,
): Promise<{
  encryptedWhitelistedSubmitterIds: EncryptedStringsMessageContent | null
}> => {
  if (!formId) throw new Error('No formId provided')

  return queryClient.fetchQuery(
    adminFormSettingsKeys.whitelist(formId),
    () => getFormEncryptedWhitelistedSubmitterIds(formId),
    // Disable caching by setting stale time to 0.
    { staleTime: 0 },
  )
}

export const useAdminFormPayments = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const [hasPaymentCapabilities, setHasPaymentCapabilities] = useState(false)

  const { data, ...rest } = useQuery(
    adminFormSettingsKeys.payment_channel(formId),
    () => validateStripeAccount(formId),
    {
      onSuccess: ({ account }) => {
        // TODO: Add validation for connected stripe account, depending on a variety of factors.
        // Factors can be whether the account is connected, whether the account is verified, whether the account is in test mode, etc.
        // Factors can be found here: https://stripe.com/docs/api/accounts/object#account_object-requirements
        setHasPaymentCapabilities(!!account && account.charges_enabled)
      },
      staleTime: 0,
    },
  )

  return {
    hasPaymentCapabilities,
    data,
    ...rest,
  }
}
