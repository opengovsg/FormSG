import React, { useState } from 'react'
import { useParams } from 'react-router'
import { Skeleton } from '@chakra-ui/react'

import { StorageModeSubmissionMetadata } from '~shared/types/submission'

import Button from '~components/Button'

import { useAdminFormSettings } from '../settings/queries'

import { useFormResponses } from './queries'
import useDecryptionWorkers from './useDecryptionWorkers'

const ResponsesPage = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()
  const { data, isLoading } = useFormResponses()
  const { formId } = useParams()
  const [secretKey, setSecretKey] = useState<string>('')
  const { downloadEncryptedResponses } = useDecryptionWorkers()

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
        <Button
          onClick={() =>
            downloadEncryptedResponses(formId!, settings!.title, secretKey)
          }
        >
          Export csv
        </Button>
        <Button>Export csv and attachments</Button>
        {!!data &&
          data.metadata.map((submission: StorageModeSubmissionMetadata) => {
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
export default ResponsesPage
