import { BiCheck } from 'react-icons/bi'
import { Box, Divider, Flex, Icon, Link, Text } from '@chakra-ui/react'
import { keyBy } from 'lodash'

import { PaymentStatus, SubmissionPaymentDto } from '~shared/types'

import { Tag } from '~components/Tag'

import { getPaymentDataView } from '../common/utils/getPaymentDataView'

type PaymentDataItemProps = {
  name: string
  value: string
  isMonospace?: boolean
  isUrl?: boolean
}

const PaymentDataItem = ({
  name,
  value,
  isMonospace,
  isUrl,
}: PaymentDataItemProps): JSX.Element => {
  return (
    <Flex flexDir={{ base: 'column', md: 'row' }} gap="0.25rem">
      <Text textStyle="subhead-1">{name}:</Text>
      <Text textStyle={isMonospace ? 'monospace' : undefined}>
        {isUrl ? (
          <Link href={value} target="_blank">
            {value}
          </Link>
        ) : (
          value
        )}
      </Text>
    </Flex>
  )
}

type PaymentSectionProps = {
  payment: SubmissionPaymentDto
}

export const PaymentSection = ({
  payment,
}: PaymentSectionProps): JSX.Element | null => {
  if (!payment) return null

  const displayPayoutSection = payment.payoutId || payment.payoutDate

  const paymentDataMap = keyBy(getPaymentDataView(payment), 'key')

  const paymentTagProps =
    payment.status === PaymentStatus.Succeeded
      ? { label: 'Success', colorScheme: 'success', rightIcon: BiCheck }
      : payment.status === PaymentStatus.PartiallyRefunded
      ? { label: 'Partially refunded', colorScheme: 'secondary' }
      : payment.status === PaymentStatus.FullyRefunded
      ? { label: 'Fully refunded', colorScheme: 'secondary' }
      : payment.status === PaymentStatus.Disputed
      ? { label: 'Disputed', colorScheme: 'warning' }
      : // The remaining options should never appear.
        undefined

  // Error: the payment is invalid and should not reach this state
  if (!paymentTagProps) return null

  return (
    <Flex flexDir="column" gap="2rem">
      <Flex flexDir="column" gap="1.25rem">
        <Flex gap="1.5rem">
          <Text textStyle="h2" as="h2" color="primary.500">
            Payment
          </Text>
          <Tag colorScheme={paymentTagProps.colorScheme}>
            <Text textStyle="caption-1">{paymentTagProps.label}</Text>
            {paymentTagProps.rightIcon && (
              <Icon as={paymentTagProps.rightIcon} ml="0.25rem" />
            )}
          </Tag>
        </Flex>
        <Flex flexDir="column" gap="0.5rem">
          <PaymentDataItem {...paymentDataMap['email']} />
          <PaymentDataItem {...paymentDataMap['receiptUrl']} isUrl />
          <Box py="0.75rem">
            <Divider />
          </Box>
          <PaymentDataItem {...paymentDataMap['paymentIntentId']} isMonospace />
          <PaymentDataItem {...paymentDataMap['amount']} />
          <PaymentDataItem {...paymentDataMap['paymentDate']} />
          <Box py="0.75rem">
            <Divider />
          </Box>
          <PaymentDataItem {...paymentDataMap['transactionFee']} />
        </Flex>
      </Flex>
      {displayPayoutSection && (
        <Flex flexDir="column" gap="1rem">
          <Text textStyle="h2" as="h2" color="primary.500">
            Payout
          </Text>
          <Flex flexDir="column" gap="0.5rem">
            <PaymentDataItem {...paymentDataMap['payoutId']} isMonospace />
            <PaymentDataItem {...paymentDataMap['payoutDate']} />
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
