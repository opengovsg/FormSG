import { useMutation, useQueryClient } from 'react-query'

import { claimGoLink } from './GoGovService'
import { goGovKeys } from './queries'

export const useListShortenerMutations = (formId: string) => {
  const queryClient = useQueryClient()

  const claimGoLinkMutation = useMutation(
    ({ linkSuffix, adminEmail }: { linkSuffix: string; adminEmail: string }) =>
      claimGoLink(linkSuffix, formId, adminEmail),
    { onSuccess: () => queryClient.invalidateQueries(goGovKeys.id(formId)) },
  )

  return { claimGoLinkMutation }
}
