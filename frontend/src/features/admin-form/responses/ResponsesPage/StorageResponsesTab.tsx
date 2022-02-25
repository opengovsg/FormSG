import { useCallback, useState } from 'react'
import { useParams } from 'react-router'
import { Skeleton } from '@chakra-ui/react'

import { AdminStorageFormDto } from '~shared/types/form'
import { StorageModeSubmissionMetadata } from '~shared/types/submission'

import Button from '~components/Button'

import { useFormResponses } from '../queries'
import useDecryptionWorkers from '../useDecryptionWorkers'

interface StorageResponsesTabProps {
  form: AdminStorageFormDto
}

export const StorageResponsesTab = ({
  form,
}: StorageResponsesTabProps): JSX.Element => {
  const { data, isLoading } = useFormResponses()
  const { formId } = useParams()
  const [secretKey, setSecretKey] = useState<string>('')
  const { downloadEncryptedResponses } = useDecryptionWorkers()

  const handleExportCsv = useCallback(() => {
    console.log(formId, form.title)
    if (!formId || !form.title) return
    return downloadEncryptedResponses(formId, form.title, secretKey)
  }, [downloadEncryptedResponses, formId, secretKey, form.title])

  return (
    <Skeleton isLoaded={!isLoading && !!data}>
      <div>
        Enter secret key:
        <input
          style={{ backgroundColor: 'grey' }}
          type="text"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
        />
        <Button onClick={handleExportCsv}>Export csv</Button>
        <Button>Export csv and attachments</Button>
        {data?.metadata.map((submission: StorageModeSubmissionMetadata) => {
          return (
            <div key={submission.refNo}>
              Submission Ref No: {submission.refNo}
            </div>
          )
        })}
      </div>
    </Skeleton>
  )
}
