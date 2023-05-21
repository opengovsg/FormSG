import { useMutation } from 'react-query'

import { claimGoLink } from './GoGovService'

export const useListShortenerMutations = () => {
  const claimGoLinkMutation = useMutation(
    ({ linkSuffix, formId }: { linkSuffix: string; formId: string }) =>
      claimGoLink(linkSuffix, formId),
  )

  return { claimGoLinkMutation }
}
