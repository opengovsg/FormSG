import { useMutation } from 'react-query'

import { claimGoLink, getGoLinkAvailability } from './GoGovService'

export const useListShortenerMutations = () => {
  const getLinkSuffixMutation = useMutation(
    ({ linkSuffix }: { linkSuffix: string }) =>
      getGoLinkAvailability(linkSuffix),
  )

  const claimGoLinkMutation = useMutation(
    ({ linkSuffix, formLink }: { linkSuffix: string; formLink: string }) =>
      claimGoLink(linkSuffix, formLink),
  )

  return { getLinkSuffixMutation, claimGoLinkMutation }
}
