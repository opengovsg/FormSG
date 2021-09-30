import { useMemo } from 'react'
import { Flex, Skeleton, Text } from '@chakra-ui/react'
import format from 'date-fns/format'

import { AdminFormNavbarProps } from './AdminFormNavbar'

type AdminFormNavbarDetailsProps = Pick<AdminFormNavbarProps, 'formInfo'>

export const AdminFormNavbarDetails = ({
  formInfo,
}: AdminFormNavbarDetailsProps): JSX.Element => {
  const readableLastModified = useMemo(() => {
    if (!formInfo) return 'Date is still loading...'
    const formattedDate = format(
      new Date(formInfo.lastModified),
      'h:mm a, dd LLL y',
    )
    return `Saved at ${formattedDate}`
  }, [formInfo])

  return (
    <Flex align="flex-start" flexDir="column" justify="center">
      <Skeleton isLoaded={!!formInfo}>
        <Text
          textStyle="body-1"
          color="secondary.500"
          noOfLines={1}
          title={formInfo?.title}
        >
          {formInfo?.title ?? 'Form title loading...'}
        </Text>
      </Skeleton>

      <Skeleton isLoaded={!!formInfo}>
        <Text textStyle="legal" textTransform="uppercase" color="neutral.700">
          {readableLastModified}
        </Text>
      </Skeleton>
    </Flex>
  )
}
