import { useMemo } from 'react'
import { Link as ReactLink, useParams } from 'react-router-dom'
import { Flex, Icon, Skeleton, Text } from '@chakra-ui/react'

import { SmsCountsDto } from '~shared/types'

import { BxsCheckCircle, BxsXCircle } from '~assets/icons'
import { ADMINFORM_ROUTE, ADMINFORM_SETTINGS_SUBROUTE } from '~constants/routes'
import Link from '~components/Link'

type TwilioCredentialsMessageProps = {
  hasTwilioCredentials: boolean
  freeSmsCount: SmsCountsDto | undefined
}

const TwilioCredentialsSuccess = (): JSX.Element => {
  return (
    <Flex alignItems="flex-start" mt="0.75rem" color="secondary.500">
      <Icon as={BxsCheckCircle} mr="0.5rem" color="success.500" />
      <Text textStyle="caption-1">Twilio credentials added</Text>
    </Flex>
  )
}

export const TwilioCredentialsMessage = ({
  hasTwilioCredentials,
  freeSmsCount,
}: TwilioCredentialsMessageProps): JSX.Element => {
  const { formId } = useParams()
  const hasExceededQuota = useMemo(() => {
    return freeSmsCount && freeSmsCount.freeSmsCounts >= freeSmsCount.quota
  }, [freeSmsCount])

  if (hasTwilioCredentials) {
    return <TwilioCredentialsSuccess />
  }

  return (
    <Flex
      alignItems="flex-start"
      mt="0.75rem"
      color={hasExceededQuota ? 'danger.500' : 'secondary.500'}
    >
      <Icon as={BxsXCircle} mr="0.5rem" />
      <Skeleton isLoaded={!!freeSmsCount}>
        <Text textStyle="caption-1">
          {hasExceededQuota
            ? 'You have reached the free tier limit for SMS verification.'
            : 'Twilio credentials not added.'}{' '}
          <Link
            as={ReactLink}
            to={`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_SETTINGS_SUBROUTE}`}
            textStyle="caption-1"
          >
            Add credentials now
          </Link>
        </Text>
      </Skeleton>
    </Flex>
  )
}
