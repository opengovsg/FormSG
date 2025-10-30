import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.responses.individualResponse',
  })

  if (!payment) return null

  const paymentDataMap = keyBy(
    getPaymentDataView(window.location.origin, payment, formId, t),
    'key',
  )

  const paymentTagProps =
    payment.status === PaymentStatus.Succeeded
      ? {
          label: t('features.common.success', { ns: 'translation', keyPrefix: '' }),
          colorScheme: 'success',
          rightIcon: BiCheck,
        }
      : payment.status === PaymentStatus.PartiallyRefunded
        ? {
            label: t('paymentSection.paymentStatusLabel.partiallyRefunded'),
            colorScheme: 'secondary',
          }
        : payment.status === PaymentStatus.FullyRefunded
          ? {
              label: t('paymentSection.paymentStatusLabel.fullyRefunded'),
              colorScheme: 'secondary',
            }
          : payment.status === PaymentStatus.Disputed
            ? {
                label: t('paymentSection.paymentStatusLabel.disputed'),
                colorScheme: 'warning',
              }
            : undefined // The remaining options should never appear.

  const payoutTagProps =
    payment.payoutId || payment.payoutDate
      ? {
          label: t('features.common.success', { ns: 'translation', keyPrefix: '' }),
          colorScheme: 'success',
          rightIcon: BiCheck,
        }
      : {
          label: t('features.common.pending', { ns: 'translation', keyPrefix: '' }),
          colorScheme: 'secondary',
        }

  // Error: the payment is invalid and should not reach this state
  if (!paymentTagProps) return null

  return (
    <Flex flexDir="column" gap="4rem">
      <Flex flexDir="column" gap="1.25rem">
        <PaymentDataHeader
          name={t('paymentSection.headers.payment')}
          {...paymentTagProps}
        />
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
        <PayoutDataHeader
          name={t('paymentSection.headers.payout')}
          {...payoutTagProps}
        />
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

function PayoutDataHeader({
  name,
  label,
  colorScheme,
  rightIcon,
}: PaymentDataHeaderProps) {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.responses.individualResponse',
  })

  return (
    <Flex gap="1rem" align="center">
      <Flex>
        <Text textStyle="h2" as="h2" color="primary.500">
          {name}
        </Text>

        <Tooltip placement="top" label={t('paymentSection.tooltipLabel')}>
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
}

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

function PaymentDataItem({
  name,
  value,
  isMonospace,
  isUrl,
}: PaymentDataItemProps): JSX.Element {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.responses.individualResponse',
  })
  return (
    <Flex flexDir={{ base: 'column', md: 'row' }} gap="0.25rem">
      <Text textStyle="subhead-1">{name}:</Text>
      <Text textStyle={isMonospace ? 'monospace' : undefined}>
        {isUrl ? (
          <Link href={value} target="_blank">
            {t('paymentSection.paymentDataItemPdfDownloadLabel')}
          </Link>
        ) : (
          value
        )}
      </Text>
    </Flex>
  )
}
