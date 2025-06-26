import { Body, Head, Html, Text } from '@react-email/components'
import { SmsThresholdWarningNotificationHtmlData } from '../../services/mail/mail.types'

import { SUPPORT_FORM_LINK } from '../../../../shared/constants'

export const SmsThresholdWarningNotification = ({
  formTitle,
  formLink,
  appName,
  smsThreshold,
}: SmsThresholdWarningNotificationHtmlData): JSX.Element => {
  return (
    <Html>
      <Head />
      <Body>
        <Text>
          Your form <b>{formTitle}</b> {' '} (<a href={formLink}>{formLink}</a>)
          has used up {smsThreshold * 100}% of the free SMS OTP verifications allocated.
          Once the limit is fully reached, the form will be automatically closed to new responses.
          If you anticipate hitting the limit, please arrange for advanced billing arrangement to continue using SMS OTP. 
          Contact the FormSG support team by filling out this <a href={SUPPORT_FORM_LINK}>form</a>: (<a href={SUPPORT_FORM_LINK}>go.gov.sg/formsg-support</a>)
        </Text>

        <Text>The {appName} Support Team</Text>
      </Body>
    </Html>
  )
}
