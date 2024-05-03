import { BiMessage } from 'react-icons/bi'
import { Icon, Skeleton, Text } from '@chakra-ui/react'

import { useFreeSmsQuota } from '~features/admin-form/common/queries'

export const FreeSmsQuota = (): JSX.Element => {
  const { data: freeSmsQuota } = useFreeSmsQuota()
  return (
    <Text textStyle="caption-1" color="brand.secondary.500">
      <Skeleton
        as="span"
        isLoaded={!!freeSmsQuota}
        display="flex"
        alignItems="center"
      >
        <Icon fontSize="1rem" mr="0.5rem" as={BiMessage} />
        {freeSmsQuota?.freeSmsCounts.toLocaleString()} free SMSes used
      </Skeleton>
    </Text>
  )
}
