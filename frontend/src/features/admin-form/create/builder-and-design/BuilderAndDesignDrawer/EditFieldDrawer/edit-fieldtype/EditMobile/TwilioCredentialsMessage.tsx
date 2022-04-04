import { useParams } from 'react-router-dom'
import { Flex, Icon, Text } from '@chakra-ui/react'

import { BxsCheckCircle, BxsXCircle } from '~assets/icons'
import { ADMINFORM_ROUTE, ADMINFORM_SETTINGS_SUBROUTE } from '~constants/routes'
import Link from '~components/Link'

type TwilioCredentialsMessageProps = {
  hasTwilioCredentials: boolean
}
export const TwilioCredentialsMessage = ({
  hasTwilioCredentials,
}: TwilioCredentialsMessageProps): JSX.Element => {
  const { formId } = useParams()

  if (hasTwilioCredentials) {
    return (
      <Flex alignItems={'flex-start'} mt="0.75rem">
        <Icon as={BxsCheckCircle} mr="0.5rem" color="success.500" />
        <Text textStyle={'caption-1'}>Twilio credentials added</Text>
      </Flex>
    )
  }

  return (
    <Flex alignItems={'flex-start'} mt="0.75rem">
      <Icon as={BxsXCircle} mr="0.5rem" color="secondary.500" />
      <Text textStyle={'caption-1'}>
        Twilio credentials not added.{' '}
        <Link
          href={`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_SETTINGS_SUBROUTE}`}
          textStyle={'caption-1'}
        >
          Add credentials now
        </Link>
      </Text>
    </Flex>
  )
}
