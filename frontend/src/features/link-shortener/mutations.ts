import { useMutation } from 'react-query'

import { claimGoLink } from './GoGovService'

export const useListShortenerMutations = () => {
  const claimGoLinkMutation = useMutation(
    ({ linkSuffix, formLink }: { linkSuffix: string; formLink: string }) =>
      claimGoLink(linkSuffix, formLink),
  )

  return { claimGoLinkMutation }
}
