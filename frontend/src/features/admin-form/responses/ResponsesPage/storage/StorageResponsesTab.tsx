import { StorageModeSubmissionMetadata } from '~shared/types/submission'

import Button from '~components/Button'

import { useFormResponses } from '../../queries'
import { EmptyResponses } from '../common/EmptyResponses'
import { ResponsesTabWrapper } from '../common/ResponsesTabWrapper'

import { StorageResponsesProvider } from './ResponsesProvider'
import { SecretKeyVerification } from './SecretKeyVerification'
import { useStorageResponsesContext } from './StorageResponsesContext'

export const StorageResponsesTab = () => {
  return (
    <StorageResponsesProvider>
      <ProvidedStorageResponsesTab />
    </StorageResponsesProvider>
  )
}

const ProvidedStorageResponsesTab = (): JSX.Element => {
  const { responsesCount, secretKey, handleExportCsv } =
    useStorageResponsesContext()
  const { data } = useFormResponses()

  if (responsesCount === 0) {
    return <EmptyResponses />
  }

  return (
    <ResponsesTabWrapper>
      {secretKey ? (
        <>
          <Button onClick={handleExportCsv}>Export csv</Button>
          <Button>Export csv and attachments</Button>
          {data?.metadata.map((submission: StorageModeSubmissionMetadata) => {
            return (
              <div key={submission.refNo}>
                Submission Ref No: {submission.refNo}
              </div>
            )
          })}
        </>
      ) : (
        <SecretKeyVerification />
      )}
    </ResponsesTabWrapper>
  )
}
