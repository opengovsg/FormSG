import { useMutation, useQueryClient } from 'react-query'

import { claimGoLink } from './GoGovService'
import { goGovKeys } from './queries'

export const useListShortenerMutations = () => {
  const queryClient = useQueryClient()

  const claimGoLinkMutation = useMutation(
    ({
      linkSuffix,
      formId,
      adminEmail,
    }: {
      linkSuffix: string
      formId: string
      adminEmail: string
    }) => claimGoLink(linkSuffix, formId, adminEmail),
    { onSuccess: () => queryClient.invalidateQueries(goGovKeys.all) },
  )

  return { claimGoLinkMutation }
}
