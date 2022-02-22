import React, { useCallback, useState } from 'react'
import { useParams } from 'react-router'
import { Skeleton } from '@chakra-ui/react'

import { StorageModeSubmissionMetadata } from '~shared/types/submission'

import Button from '~components/Button'

import { useAdminFormSettings } from '../settings/queries'

import { useFormResponses } from './queries'
import useDecryptionWorkers from './useDecryptionWorkers'

const ResultsPage = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()
  const { data, isLoading } = useFormResponses()
  const { formId } = useParams()
  const [secretKey, setSecretKey] = useState<string>('')
  const { downloadEncryptedResponses } = useDecryptionWorkers()

  const handleExportCsv = useCallback(() => {
    console.log(formId, settings?.title)
    if (!formId || !settings?.title) return
    return downloadEncryptedResponses(formId, settings.title, secretKey)
  }, [downloadEncryptedResponses, formId, secretKey, settings?.title])

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
export default ResultsPage
