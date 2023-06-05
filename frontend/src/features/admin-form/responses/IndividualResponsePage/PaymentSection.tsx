import { BiCheck } from 'react-icons/bi'
import { IconType } from 'react-icons/lib'
import { Box, Divider, Flex, Icon, Link, Text } from '@chakra-ui/react'
import { keyBy } from 'lodash'

import { PaymentStatus, SubmissionPaymentDto } from '~shared/types'

import { Tag } from '~components/Tag'

import { getPaymentDataView } from '../common/utils/getPaymentDataView'

type PaymentSectionProps = {
  payment: SubmissionPaymentDto
  formId: string
}

export const PaymentSection = ({
  payment,
  formId,
}: PaymentSectionProps): JSX.Element | null => {
  if (!payment) return null

  const paymentDataMap = keyBy(
    getPaymentDataView(window.location.origin, payment, formId),
    'key',
  )

  const paymentTagProps =
    payment.status === PaymentStatus.Succeeded
      ? { label: 'Success', colorScheme: 'success', rightIcon: BiCheck }
      : payment.status === PaymentStatus.PartiallyRefunded
      ? { label: 'Partially refunded', colorScheme: 'secondary' }
      : payment.status === PaymentStatus.FullyRefunded
      ? { label: 'Fully refunded', colorScheme: 'secondary' }
      : payment.status === PaymentStatus.Disputed
      ? { label: 'Disputed', colorScheme: 'warning' }
      : undefined // The remaining options should never appear.

  const payoutTagProps =
    payment.payoutId || payment.payoutDate
      ? { label: 'Success', colorScheme: 'success', rightIcon: BiCheck }
      : { label: 'Pending', colorScheme: 'secondary' }

  // Error: the payment is invalid and should not reach this state
  if (!paymentTagProps) return null

  return (
    <Flex flexDir="column" gap="4rem">
      <Flex flexDir="column" gap="1.25rem">
        <PaymentDataHeader name="Payment" {...paymentTagProps} />
        <Flex flexDir="column" gap="0.75rem">
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
      <Flex flexDir="column" gap="1.25rem">
        <PaymentDataHeader name="Payout" {...payoutTagProps} />
        <Flex flexDir="column" gap="0.75rem">
          <PaymentDataItem {...paymentDataMap['payoutId']} isMonospace />
          <PaymentDataItem {...paymentDataMap['payoutDate']} />
        </Flex>
      </Flex>
    </Flex>
  )
}

type PaymentDataHeaderProps = {
  name: string
  label: string
  colorScheme: string
  rightIcon?: IconType
}

const PaymentDataHeader = ({
  name,
  label,
  colorScheme,
  rightIcon,
}: PaymentDataHeaderProps) => (
  <Flex gap="1.5rem">
    <Text textStyle="h2" as="h2" color="primary.500">
      {name}
    </Text>
    <Tag colorScheme={colorScheme}>
      <Text textStyle="caption-1">{label}</Text>
      {rightIcon && <Icon as={rightIcon} ml="0.25rem" />}
    </Tag>
  </Flex>
)

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
            Download as PDF
          </Link>
        ) : (
          value
        )}
      </Text>
    </Flex>
  )
}
