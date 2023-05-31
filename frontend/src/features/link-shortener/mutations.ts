import { useMutation } from 'react-query'

import { claimGoLink } from './GoGovService'

export const useListShortenerMutations = () => {
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
  )

  return { claimGoLinkMutation }
}
