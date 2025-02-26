import { useState } from 'react'
import { BiBell, BiCheck } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { useFormRemindersMutations } from '~features/admin-form/common/mutations'

export const SendReminderButton = ({ responseId }: { responseId: string }) => {
  const { formId } = useParams()
  const { sendReminderForResponseMutation } = useFormRemindersMutations()

  const sendReminderForResponse = sendReminderForResponseMutation

  const [isSent, setIsSent] = useState(false)

  if (!formId) {
    return null
  }

  return !isSent ? (
    <Button
      loadingText="Sending"
      m="0"
      p="0"
      variant="clear"
      leftIcon={<BiBell />}
      onClick={(e) => {
        e.stopPropagation()
        sendReminderForResponse.mutate({ formId, responseId })
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
