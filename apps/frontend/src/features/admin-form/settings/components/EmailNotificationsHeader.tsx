import { useTranslation } from 'react-i18next'

import { OGP_PLUMBER } from '~constants/links'
import InlineMessage from '~components/InlineMessage'

interface EmailNotificationsHeaderProps {
  isFormPublic: boolean
  isPaymentsEnabled: boolean
}

export const EmailNotificationsHeader = ({
  isFormPublic,
  isPaymentsEnabled,
}: EmailNotificationsHeaderProps) => {
  const { t } = useTranslation()
  if (isFormPublic) {
    return (
      <InlineMessage marginBottom="40px">
        {t(
          'features.adminForm.settings.emailNotifications.header.closeFormFirst',
        )}
      </InlineMessage>
    )
  }

  if (isPaymentsEnabled) {
    return (
      <InlineMessage useMarkdown marginBottom="40px">
        {t(
          'features.adminForm.settings.emailNotifications.header.noEmailsForPaymentForms',
          { url: OGP_PLUMBER },
        )}
      </InlineMessage>
    )
  }

  return null
}
