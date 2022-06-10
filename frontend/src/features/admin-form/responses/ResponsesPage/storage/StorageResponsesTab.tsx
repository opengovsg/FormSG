import { EmptyResponses } from '../common/EmptyResponses'

import { SecretKeyVerification } from './SecretKeyVerification'
import { useStorageResponsesContext } from './StorageResponsesContext'
import { UnlockedResponses } from './UnlockedResponses'

export const StorageResponsesTab = (): JSX.Element => {
  const { responsesCount, secretKey } = useStorageResponsesContext()

  if (responsesCount === 0) {
    return <EmptyResponses />
  }

  return secretKey ? <UnlockedResponses /> : <SecretKeyVerification />
}
