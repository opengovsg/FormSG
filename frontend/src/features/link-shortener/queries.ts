import { useQuery, UseQueryResult } from 'react-query'

import { getGoLinkSuffix } from './GoGovService'

export const useGoLink = (
  formId: string,
): UseQueryResult<{ goLinkSuffix: string }> => {
  return useQuery(formId, () => getGoLinkSuffix(formId), {
    enabled: !!formId,
  })
}
