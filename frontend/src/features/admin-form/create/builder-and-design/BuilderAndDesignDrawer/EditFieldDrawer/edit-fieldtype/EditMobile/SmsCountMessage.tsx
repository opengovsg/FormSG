import { useTranslation } from 'react-i18next'
import { BiMessage } from 'react-icons/bi'
import { Flex, Icon, Skeleton, Text } from '@chakra-ui/react'

import { SmsCountsDto } from '~shared/types'

import { formatSmsCounts } from './utils'

type SmsCountMessageProps = {
  smsCount: SmsCountsDto | undefined
}

export const SmsCountMessage = ({
  smsCount,
}: SmsCountMessageProps): JSX.Element => {
  const { t } = useTranslation()
  const textColor = 'secondary.500'
  return (
    <Flex mt="1rem" color={textColor}>
      <Icon as={BiMessage} mr="0.5rem" />
      <Skeleton isLoaded={!!smsCount}>
        <Text textStyle="caption-1">{`${formatSmsCounts(smsCount)} ${t(
          'features.adminForm.sidebar.fields.mobileNo.otpVerification.smsUsed',
        )}`}</Text>
      </Skeleton>
    </Flex>
  )
}
