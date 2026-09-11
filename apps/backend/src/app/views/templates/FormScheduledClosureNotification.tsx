import { Link, Section, Text } from '@react-email/components'

import { FormScheduledClosureNotificationHtmlData } from '../../services/mail/mail.types'

import { EmailButton, EmailLayout, EmailMargin } from './EmailLayout'
import {
  answerMargin,
  cardSectionStyle,
  linkStyle,
  primaryTextStyle,
  questionMargin,
  secondaryTextStyle,
} from './emailStyles'

/**
 * Sent once, when a scheduled closure closes a form. The admin set the deadline
 * themselves, so this confirms rather than warns: no remediation, no support
 * link, unlike its siblings.
 */
export const FormScheduledClosureNotification = ({
  formTitle,
  formLink,
  formSettingsLink,
  closedAt,
  appName,
}: FormScheduledClosureNotificationHtmlData): JSX.Element => {
  return (
    <EmailLayout emailTitle="Your form has closed">
      <Text style={{ ...secondaryTextStyle, marginBottom: '40px' }}>
        Your form reached the expiry date you set and has stopped accepting
        responses.
      </Text>

      <Section style={cardSectionStyle}>
        <Text style={{ ...primaryTextStyle, ...questionMargin }}>
          Form title
        </Text>
        <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
          {formTitle}
        </Text>
        <Text style={{ ...primaryTextStyle, ...questionMargin }}>
          Closed at
        </Text>
        <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
          {closedAt}
        </Text>
        <Text style={{ ...primaryTextStyle, ...questionMargin }}>
          Form link
        </Text>
        <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
          <Link href={formLink} style={linkStyle}>
            {formLink}
          </Link>
        </Text>
      </Section>
      <EmailMargin height={40} />

      <Text style={{ ...secondaryTextStyle, marginBottom: '24px' }}>
        To collect more responses, reopen the form and set a new expiry date in
        its settings.
      </Text>
      <EmailButton href={formSettingsLink}>Go to form settings</EmailButton>
      <EmailMargin height={24} />
      <Text style={secondaryTextStyle}>The {appName} Support Team</Text>
      <EmailMargin height={40} />
    </EmailLayout>
  )
}
