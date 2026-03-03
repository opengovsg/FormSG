import { Body, Head, Html, Text, Link } from '@react-email/components'
import { FormDeactivatedNotificationHtmlData } from '../../services/mail/mail.types'
import { SUPPORT_FORM_LINK } from '../../../../shared/constants'

export const FormDeactivatedNotification = ({
  formTitle,
  formLink,
  appName,
}: FormDeactivatedNotificationHtmlData): JSX.Element => {
  return (
    <Html>
      <Head />
      <Body>
        <Text>Dear form admins(s),</Text>
        <Text>
            Your <b>{formTitle}</b> {' '} (<a href={formLink}>{formLink}</a>)
            has been closed to new responses because it has exceeded the number of free SMSes.
            Please fill out this form (<a href={SUPPORT_FORM_LINK}>go.gov.sg/formsg-support</a>)
            to reach out to the FormSG support team.
        </Text>

        <Text>The {appName} Support Team</Text>
      </Body>
    </Html>
  )
}
