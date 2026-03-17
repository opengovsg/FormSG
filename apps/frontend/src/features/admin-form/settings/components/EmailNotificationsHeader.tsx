import { useTranslation } from 'react-i18next'
import { BiBulb } from 'react-icons/bi'
import { Flex, Icon } from '@chakra-ui/react'

import { GUIDE_FORM_MRF, OGP_PLUMBER } from '~constants/links'
import { useMdComponents } from '~hooks/useMdComponents'
import InlineMessage from '~components/InlineMessage'
import { MarkdownText } from '~components/MarkdownText'

const MRFAdvertisingInfobox = () => {
  const mdComponents = useMdComponents()

  return (
    <Flex bg="primary.100" p="1rem" marginBottom="40px">
      <Icon as={BiBulb} color="primary.500" fontSize="1.5rem" mr="0.5rem" />
      <MarkdownText
        components={mdComponents}
      >{`Require routing and approval? [Check out our new feature: Multi-respondent forms!](${GUIDE_FORM_MRF})`}</MarkdownText>
    </Flex>
  )
}

interface EmailNotificationsHeaderProps {
  isFormPublic: boolean
  isPaymentsEnabled: boolean
  isFormResponseModeEmail: boolean
}

export const EmailNotificationsHeader = ({
  isFormPublic,
  isPaymentsEnabled,
  isFormResponseModeEmail,
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

  if (isFormResponseModeEmail) {
    return <MRFAdvertisingInfobox />
  }

  return null
}
