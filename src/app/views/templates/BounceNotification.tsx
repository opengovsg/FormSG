import { Body, Head, Html, Text, Link } from '@react-email/components'

import { outerContainerStyle } from './styles'
import { BounceNotificationHtmlData } from '../../services/mail/mail.types'

export const BounceNotification = ({
  formTitle,
  formLink,
  bouncedRecipients,
  appName,
}: BounceNotificationHtmlData): JSX.Element => {
  return (
    <Html>
      <Head />
      <Body>
        <Text>Dear form admins(s),</Text>
        <Text>
          We’re reaching out urgently regarding your FormSG form {formTitle}(
          {formLink}). Responses to the following recipient(s) could not be
          delivered: {bouncedRecipients}. This was likely due to their mailbox
          being full.
        </Text>
        <Text>
          Please refer to our{' '}
          <Link href="https://go.gov.sg/formsg-guide-bounces">guide</Link> for
          next steps on how to resolve this issue.
        </Text>

        <Text>The {appName} Support Team</Text>
      </Body>
    </Html>
  )
}
