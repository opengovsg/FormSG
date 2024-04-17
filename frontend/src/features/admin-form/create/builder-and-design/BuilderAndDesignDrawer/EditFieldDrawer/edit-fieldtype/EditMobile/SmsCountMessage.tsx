import { BiMessage } from 'react-icons/bi'
import { Flex, Icon, Skeleton, Text } from '@chakra-ui/react'

import { SmsCountsDto } from '~shared/types/form'

import { formatSmsCounts } from './utils'

type SmsCountMessageProps = {
  freeSmsCount: SmsCountsDto | undefined
}

export const SmsCountMessage = ({
  freeSmsCount,
}: SmsCountMessageProps): JSX.Element => {
  const textColor = 'secondary.500'

  return (
    <Flex mt="1rem" color={textColor}>
      <Icon as={BiMessage} mr="0.5rem" />
      <Skeleton isLoaded={!!freeSmsCount}>
        <Text textStyle="caption-1">{formatSmsCounts(freeSmsCount)}</Text>
      </Skeleton>
    </Flex>
  )
}
