import React, { useState } from 'react'
import { useParams } from 'react-router'
import { Skeleton } from '@chakra-ui/react'

import Button from '~components/Button'

import { useAdminFormSettings } from '../settings/queries'

import { downloadEncryptedResponses } from './AdminSubmissionsService'
import { useFormResponses } from './queries'

const ResponsesPage = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()
  const { data, isLoading } = useFormResponses()
  const { formId } = useParams()
  const [secretKey, setSecretKey] = useState<string>('')

  const handleCsvExport = async () => {
    console.log('EXPORTING CSV')
    const title = settings!.title
    console.log(title)
    console.log(formId)
    console.log(secretKey)
    await downloadEncryptedResponses(formId!, title, secretKey)
  }

  return (
    <Skeleton isLoaded={!isLoading && !!data}>
      <div>
        Enter secret key:
        <input
          style={{ backgroundColor: 'red' }}
          type="text"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
        />
        <Button onClick={handleCsvExport}>Export csv </Button>
        <Button>Export csv and attachments</Button>
        {!!data &&
          data.metadata.map((submission: any) => {
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
