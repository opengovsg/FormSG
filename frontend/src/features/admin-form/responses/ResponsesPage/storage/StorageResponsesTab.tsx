import { EmptyResponses } from '../common/EmptyResponses'
import { ResponsesTabWrapper } from '../common/ResponsesTabWrapper'

import { SecretKeyVerification } from './SecretKeyVerification'
import { useStorageResponsesContext } from './StorageResponsesContext'
import { StorageResponsesProvider } from './StorageResponsesProvider'
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
