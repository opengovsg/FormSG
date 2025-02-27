import { useState } from 'react'
import { BiBell, BiCheck } from 'react-icons/bi'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import { Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { useFormRemindersMutations } from '~features/admin-form/common/mutations'
import { getDecryptedSubmissionById } from '~features/admin-form/responses/AdminSubmissionsService'

import { useStorageResponsesContext } from '../../StorageResponsesContext'

export const SendReminderButton = ({ responseId }: { responseId: string }) => {
  const { formId = '' } = useParams()
  const { secretKey } = useStorageResponsesContext()

  const { sendReminderForResponseMutation } = useFormRemindersMutations()

  const sendReminderForResponse = sendReminderForResponseMutation

  const [isSent, setIsSent] = useState(false)

  const { data: submissionData, isLoading } = useQuery('submissionData', () =>
    getDecryptedSubmissionById({
      formId,
      submissionId: responseId,
      secretKey,
    }),
  )

  const submissionSecretKey = submissionData?.submissionSecretKey

  if (!formId || (!isLoading && !submissionSecretKey)) {
    return null
  }

  return !isSent ? (
    <Button
      isLoading={isLoading}
      loadingText="Sending"
      m="0"
      p="0"
      variant="clear"
      leftIcon={<BiBell />}
      onClick={(e) => {
        e.stopPropagation()
        if (!submissionSecretKey) {
          return
        }
        sendReminderForResponse.mutate({
          formId,
          responseId,
          submissionSecretKey,
        })
        setIsSent(true)
      }}
    >
      <Text textStyle="subhead-2">Send reminder</Text>
    </Button>
  ) : (
    <Button variant="clear" m="0" p="0" leftIcon={<BiCheck />} isDisabled>
      <Text textStyle="subhead-2">Reminder sent</Text>
    </Button>
  )
}
