import { useQuery, UseQueryResult } from 'react-query'

import { getGoLinkSuffix } from './GoGovService'

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useGoLink = (
  formId: string,
): UseQueryResult<{ goLinkSuffix: string }> => {
  return useQuery(formId, () => getGoLinkSuffix(formId), {
    enabled: !!formId,
  })
}
