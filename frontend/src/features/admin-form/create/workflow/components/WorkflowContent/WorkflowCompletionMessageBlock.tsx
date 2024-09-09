import { Link as ReactLink } from 'react-router-dom'
import { Link, Text } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

export const WorkflowCompletionMessageBlock = (): JSX.Element => {
  return (
    <InlineMessage variant="info">
      <Text>
        When the workflow is complete, email notifications can be sent to
        respondents and other parties. Set up{' '}
        <Link as={ReactLink} to={'settings/email-notifications'}>
          email notifications
        </Link>{' '}
        in settings.
      </Text>
    </InlineMessage>
  )
}
