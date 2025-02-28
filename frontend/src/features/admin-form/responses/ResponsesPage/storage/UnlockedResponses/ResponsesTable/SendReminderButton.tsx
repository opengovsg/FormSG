import { useState } from 'react'
import { BiBell, BiCheck } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { useFormRemindersMutations } from '~features/admin-form/common/mutations'
import { useGetIndividualDecryptedSubmission } from '~features/admin-form/responses/IndividualResponsePage/queries'

export const SendReminderButton = ({
  submissionId,
}: {
  submissionId: string
}) => {
  const { formId = '' } = useParams()

  const { sendReminderForResponseMutation } = useFormRemindersMutations()

  const sendReminderForResponse = sendReminderForResponseMutation

  const [isSent, setIsSent] = useState(false)

  const { data: submissionData, isLoading: isLoadingSubmissionData } =
    useGetIndividualDecryptedSubmission({
      formId,
      submissionId,
    })

  // Used to define a test key for Storybook UI Testing
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
  const submissionSecretKey = isTest
    ? 'storybook-test-dummy-key'
    : submissionData?.submissionSecretKey

  if (!formId || (!isLoadingSubmissionData && !submissionSecretKey)) {
    return null
  }

  return !isSent ? (
    <Button
      isLoading={isLoadingSubmissionData}
      loadingText={isLoadingSubmissionData ? 'Loading' : 'Sending'}
      m="0"
      p="0"
      variant="clear"
      leftIcon={<BiBell />}
      _focus={{}}
      onClick={(e) => {
        e.stopPropagation()
        if (!submissionSecretKey) {
          return
        }
        sendReminderForResponse.mutate({
          formId,
          submissionId,
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
