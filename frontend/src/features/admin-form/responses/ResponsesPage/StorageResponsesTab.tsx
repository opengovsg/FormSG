import { Container } from '@chakra-ui/react'

import { AdminStorageFormDto } from '~shared/types/form'
import { StorageModeSubmissionMetadata } from '~shared/types/submission'

import Button from '~components/Button'

import { useFormResponses } from '../queries'

import { EmptyResponses } from './EmptyResponses'
import { useResponsesContext } from './ResponsesContext'
import { SecretKeyVerification } from './SecretKeyVerification'

interface StorageResponsesTabProps {
  form: AdminStorageFormDto
}

export const StorageResponsesTab = ({
  form,
}: StorageResponsesTabProps): JSX.Element => {
  const { responsesCount, secretKey, handleExportCsv } = useResponsesContext()
  const { data } = useFormResponses()

  if (responsesCount === 0) {
    return <EmptyResponses />
  }

  return (
    <Container
      overflowY="auto"
      p="3rem"
      maxW="69.5rem"
      flex={1}
      display="flex"
      flexDir="column"
    >
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
    </Container>
  )
}
