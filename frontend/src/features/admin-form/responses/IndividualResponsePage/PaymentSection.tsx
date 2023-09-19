import { BiCheck, BiInfoCircle } from 'react-icons/bi'
import { IconType } from 'react-icons/lib'
import { Box, Divider, Flex, Icon, Link, Text } from '@chakra-ui/react'
import { keyBy } from 'lodash'

import { PaymentStatus, SubmissionPaymentDto } from '~shared/types'

import Badge from '~components/Badge'
import Tooltip from '~components/Tooltip'

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
          <PaymentDataItem {...paymentDataMap['products']} />
          <PaymentDataItem {...paymentDataMap['paymentDate']} />
          <Box py="0.75rem">
            <Divider />
          </Box>
          <PaymentDataItem {...paymentDataMap['transactionFee']} />
        </Flex>
      </Flex>
      <Flex flexDir="column" gap="1.25rem">
        <PayoutDataHeader name="Payout to bank account" {...payoutTagProps} />
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

const PayoutDataHeader = ({
  name,
  label,
  colorScheme,
  rightIcon,
}: PaymentDataHeaderProps) => (
  <Flex gap="1rem" align="center">
    <Flex>
      <Text textStyle="h2" as="h2" color="primary.500">
        {name}
      </Text>

      <Tooltip
        placement="top"
        label="This is when money collected gets deposited into your bank account.
        Depending on payment method, payouts happen 1 - 3 working days after a respondent makes payment."
      >
        <Flex justify="center" align="center">
          <Icon as={BiInfoCircle} fontSize="1.25rem" ml="0.5rem" />
        </Flex>
      </Tooltip>
    </Flex>
    <Badge
      colorScheme={colorScheme}
      display="flex"
      variant="subtle"
      alignItems="center"
    >
      {label}
      {rightIcon && <Icon as={rightIcon} ml="0.25rem" />}
    </Badge>
  </Flex>
)

const PaymentDataHeader = ({
  name,
  label,
  colorScheme,
  rightIcon,
}: PaymentDataHeaderProps) => (
  <Flex gap="1rem" align="center">
    <Text textStyle="h2" as="h2" color="primary.500">
      {name}
    </Text>
    <Badge
      colorScheme={colorScheme}
      display="flex"
      variant="subtle"
      alignItems="center"
    >
      {label}
      {rightIcon && <Icon as={rightIcon} ml="0.25rem" />}
    </Badge>
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
