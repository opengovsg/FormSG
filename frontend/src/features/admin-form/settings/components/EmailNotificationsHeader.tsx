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
  if (isFormPublic) {
    return (
      <InlineMessage marginBottom="40px">
        To change admin email recipients, close your form to new responses.
      </InlineMessage>
    )
  }

  if (isPaymentsEnabled) {
    return (
      <InlineMessage useMarkdown marginBottom="40px">
        {`Email notifications for payment forms are not available in FormSG. You can configure them using [Plumber](${OGP_PLUMBER}).`}
      </InlineMessage>
    )
  }

  if (isFormResponseModeEmail) {
    return <MRFAdvertisingInfobox />
  }

  return null
}
