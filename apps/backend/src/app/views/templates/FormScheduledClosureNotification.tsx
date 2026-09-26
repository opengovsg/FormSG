import { Link, Text } from '@react-email/components'

import { FormScheduledClosureNotificationHtmlData } from '../../services/mail/mail.types'

import { EmailButton, EmailLayout, EmailMargin } from './EmailLayout'
import { linkStyle, secondaryTextStyle } from './emailStyles'

/**
 * Sent once, when a scheduled closure closes a form. The admin set the deadline
 * themselves, so this confirms rather than warns: no remediation, no support
 * link, unlike its siblings. Laid out as a letter, like the deactivation
 * notification, on the shared styled chrome.
 */
export const FormScheduledClosureNotification = ({
  formTitle,
  formLink,
  formSettingsLink,
  closedAt,
}: FormScheduledClosureNotificationHtmlData): JSX.Element => {
  return (
    <EmailLayout>
      <Text style={secondaryTextStyle}>Dear form admin(s),</Text>
      <Text style={secondaryTextStyle}>
        Your form <b>{formTitle}</b> (
        <Link href={formLink} style={linkStyle}>
          {formLink}
        </Link>
        ) has been closed after the response deadline set at <b>{closedAt}</b>.
        Responses submitted after this time were not accepted, even if the form
        still appeared open for a short while.
      </Text>
      <Text style={{ ...secondaryTextStyle, marginBottom: '24px' }}>
        If you need to continue collecting responses, you can reopen the form in
        the settings.
      </Text>
      <EmailButton href={formSettingsLink}>Go to form settings</EmailButton>
      <EmailMargin height={40} />
    </EmailLayout>
  )
}
