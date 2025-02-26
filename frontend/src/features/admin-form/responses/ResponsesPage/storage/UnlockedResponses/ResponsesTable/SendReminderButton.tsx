import { useState } from 'react'
import { BiBell, BiCheck } from 'react-icons/bi'
import { Text } from '@chakra-ui/react'

import Button from '~components/Button'

export const SendReminderButton = ({ responseId }: { responseId: string }) => {
  const sendReminder = (responseId: string) => {
    console.log(`Sending reminder for ${responseId}`)
  }

  const [isSent, setIsSent] = useState(false)

  return !isSent ? (
    <Button
      loadingText="Sending"
      m="0"
      p="0"
      variant="clear"
      leftIcon={<BiBell />}
      onClick={(e) => {
        e.stopPropagation()
        sendReminder(responseId)
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
