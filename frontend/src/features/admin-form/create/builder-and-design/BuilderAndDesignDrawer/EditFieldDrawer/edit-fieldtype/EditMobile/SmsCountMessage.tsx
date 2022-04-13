import { useMemo } from 'react'
import { BiMessage } from 'react-icons/bi'
import { Flex, Icon, Skeleton, Text } from '@chakra-ui/react'

import { SmsCountsDto } from '~shared/types/form'

import { formatSmsCounts } from './utils'

type SmsCountMessageProps = {
  hasTwilioCredentials: boolean
  freeSmsCount: SmsCountsDto | undefined
}

export const SmsCountMessage = ({
  hasTwilioCredentials,
  freeSmsCount,
}: SmsCountMessageProps): JSX.Element => {
  const textColor = useMemo(() => {
    if (hasTwilioCredentials) return 'secondary.500'
    return freeSmsCount && freeSmsCount.freeSmsCounts >= freeSmsCount.quota
      ? 'danger.500'
      : 'secondary.500'
  }, [freeSmsCount, hasTwilioCredentials])

  return (
    <Flex mt="1rem" color={textColor}>
      <Icon as={BiMessage} mr="0.5rem" />
      <Skeleton isLoaded={!!freeSmsCount}>
        <Text
          textDecorationLine={hasTwilioCredentials ? 'line-through' : undefined}
          textStyle="caption-1"
        >
          {formatSmsCounts(freeSmsCount)}
        </Text>
      </Skeleton>
    </Flex>
  )
}
