import { Link as ReactLink } from 'react-router-dom'
import { Link, Text } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

export const DefaultOutcomeNotificationBlock = (): JSX.Element => {
  return (
    <InlineMessage variant="info">
      <Text>
        When the workflow ends, the respondent in step 1 will be informed by
        default. You can choose who else to inform by configuring{' '}
        <Link as={ReactLink} to={'settings/email-notifications'}>
          email notifications
        </Link>
        .
      </Text>
    </InlineMessage>
  )
}
