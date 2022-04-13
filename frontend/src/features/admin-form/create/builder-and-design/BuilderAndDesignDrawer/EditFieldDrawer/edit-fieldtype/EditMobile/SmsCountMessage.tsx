import { useMemo } from 'react'
import { BiMessage } from 'react-icons/bi'
import { Flex, Icon, Text } from '@chakra-ui/react'

import { SmsCountsDto } from '~shared/types/form'

import Spinner from '~components/Spinner'

import { formatSmsCounts } from './utils'

type SmsCountMessageProps = {
  freeSmsCount?: SmsCountsDto
}

export const SmsCountMessage = ({
  freeSmsCount,
}: SmsCountMessageProps): JSX.Element => {
  const hasExceededQuota = useMemo(() => {
    return freeSmsCount && freeSmsCount.freeSmsCounts >= freeSmsCount.quota
  }, [freeSmsCount])

  return (
    <Flex mt="1rem" color={hasExceededQuota ? 'danger.500' : 'secondary.500'}>
      <Icon as={BiMessage} mr="0.5rem" />
      {freeSmsCount === undefined ? (
        <Spinner />
      ) : (
        <Text textStyle={'caption-1'}>{formatSmsCounts(freeSmsCount)}</Text>
      )}
    </Flex>
  )
}
