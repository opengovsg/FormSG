import { EmptyResponses } from '../common/EmptyResponses'

import { UnlockedResponses } from './UnlockedResponses/UnlockedResponses'
import { SecretKeyVerification } from './SecretKeyVerification'
import { useStorageResponsesContext } from './StorageResponsesContext'

export const StorageResponsesTab = (): JSX.Element => {
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()

  if (totalResponsesCount === 0) {
    return <EmptyResponses />
  }

  return secretKey ? <UnlockedResponses /> : <SecretKeyVerification />
}
