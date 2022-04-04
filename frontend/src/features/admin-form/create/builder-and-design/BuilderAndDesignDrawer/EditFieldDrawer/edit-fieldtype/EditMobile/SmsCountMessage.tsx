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
  return (
    <Flex mt="1rem">
      <Icon as={BiMessage} mr="0.5rem" color="secondary.500" />
      {freeSmsCount === undefined ? (
        <Spinner />
      ) : (
        <Text textStyle={'caption-1'}>{formatSmsCounts(freeSmsCount)}</Text>
      )}
    </Flex>
  )
}
