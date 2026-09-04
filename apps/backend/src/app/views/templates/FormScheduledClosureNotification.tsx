import { Body, Head, Html, Text } from '@react-email/components'

import { FormScheduledClosureNotificationHtmlData } from '../../services/mail/mail.types'

export const FormScheduledClosureNotification = ({
  formTitle,
  formLink,
  closedAt,
  appName,
}: FormScheduledClosureNotificationHtmlData): JSX.Element => {
  return (
    <Html>
      <Head />
      <Body>
        <Text>Dear form admin(s),</Text>
        <Text>
          Your form <b>{formTitle}</b> (<a href={formLink}>{formLink}</a>) has
          stopped accepting responses, as it reached the expiry date you set:{' '}
          <b>{closedAt}</b>.
        </Text>
        <Text>
          Your existing responses are unaffected and still available. If you
          need to collect more responses, you can reopen the form and set a new
          expiry date in its settings.
        </Text>

        <Text>The {appName} Support Team</Text>
      </Body>
    </Html>
  )
}
