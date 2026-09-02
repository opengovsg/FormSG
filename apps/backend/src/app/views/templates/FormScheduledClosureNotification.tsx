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
  appName,
}: FormScheduledClosureNotificationHtmlData): JSX.Element => {
  return (
    <EmailLayout emailTitle="Form closed">
      <Text style={secondaryTextStyle}>Dear form admins(s),</Text>
      <Text style={secondaryTextStyle}>
        Your <b>{formTitle}</b> (
        <Link href={formLink} style={linkStyle}>
          {formLink}
        </Link>
        ) has been closed to new responses. It reached the closing date set by
        you or your collaborators: <b>{closedAt}</b>.
      </Text>
      <Text style={{ ...secondaryTextStyle, marginBottom: '24px' }}>
        If you need to keep collecting responses, you can reopen the form and
        set a new closing date in its settings.
      </Text>
      <EmailButton href={formSettingsLink}>Go to form settings</EmailButton>
      <EmailMargin height={24} />
      <Text style={secondaryTextStyle}>{appName} team</Text>
      <EmailMargin height={40} />
    </EmailLayout>
  )
}
