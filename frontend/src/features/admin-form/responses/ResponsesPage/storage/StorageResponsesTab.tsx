import { EmptyResponses } from '../common/EmptyResponses'
import { ResponsesTabWrapper } from '../common/ResponsesTabWrapper'

import { StorageResponsesProvider } from './ResponsesProvider'
import { SecretKeyVerification } from './SecretKeyVerification'
import { useStorageResponsesContext } from './StorageResponsesContext'
import { UnlockedResponses } from './UnlockedResponses'

export const StorageResponsesTab = () => {
  return (
    <StorageResponsesProvider>
      <ProvidedStorageResponsesTab />
    </StorageResponsesProvider>
  )
}

const ProvidedStorageResponsesTab = (): JSX.Element => {
  const { responsesCount, secretKey } = useStorageResponsesContext()

  if (responsesCount === 0) {
    return <EmptyResponses />
  }

  return (
    <ResponsesTabWrapper>
      {secretKey ? <UnlockedResponses /> : <SecretKeyVerification />}
    </ResponsesTabWrapper>
  )
}
