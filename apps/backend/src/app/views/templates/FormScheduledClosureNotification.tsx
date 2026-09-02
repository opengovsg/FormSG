import { Link, Text } from '@react-email/components'

import { FormScheduledClosureNotificationHtmlData } from '../../services/mail/mail.types'

import { EmailButton, EmailLayout, EmailMargin } from './EmailLayout'
import { linkStyle, secondaryTextStyle } from './emailStyles'

/**
 * Sent once, when a scheduled closure actually closes a form. The admin set
 * this deadline themselves, so the email confirms rather than warns — there is
 * no remediation to prescribe and no support link, unlike its siblings.
 *
 * The copy is a letter rather than a card: the form title, its link and the
 * close instant all read inline, the same shape the deactivation notification
 * uses. It sits on the shared styled chrome all the same.
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
