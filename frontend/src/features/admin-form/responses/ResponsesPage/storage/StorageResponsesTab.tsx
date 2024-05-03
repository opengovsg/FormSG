import { FormActivationSvg } from '~features/admin-form/settings/components/FormActivationSvg'

import { SecretKeyVerification } from '../../components/SecretKeyVerification'
import { EmptyResponses } from '../common/EmptyResponses'

import { useStorageResponsesContext } from './StorageResponsesContext'
import { UnlockedResponses } from './UnlockedResponses'

export const StorageResponsesTab = (): JSX.Element => {
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()

  if (totalResponsesCount === 0) {
    return <EmptyResponses />
  }

  return secretKey ? (
    <UnlockedResponses />
  ) : (
    <SecretKeyVerification
      heroSvg={<FormActivationSvg />}
      ctaText="Unlock responses"
    />
  )
}
