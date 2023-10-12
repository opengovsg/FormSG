import { useQuery, UseQueryResult } from 'react-query'

import { getGoLinkSuffix } from './GoGovService'

export const goGovKeys = {
  id: (id: string) => ['gogov', id] as const,
}

export const useGoLink = (
  formId: string,
): UseQueryResult<{ goLinkSuffix: string }> => {
  return useQuery(goGovKeys.id(formId), () => getGoLinkSuffix(formId), {
    enabled: !!formId,
  })
}
