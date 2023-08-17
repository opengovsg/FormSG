import { useMemo } from 'react'
import { BiDownload } from 'react-icons/bi'
import { Box, Divider, Stack, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import { PaymentType, ProductItem } from '~shared/types'
import { centsToDollars } from '~shared/utils/payments'

import { useToast } from '~hooks/useToast'
import Button from '~components/Button'

import { getPaymentInvoiceDownloadUrl } from '~features/public-form/utils/urls'

type DownloadReceiptBlockProps = {
  formId: string
  submissionId: string
  paymentId: string
  amount: number
  products: ProductItem[]
  paymentType?: PaymentType
  name: string
  paymentDate: Date | null
}

const PaymentSummaryRow = ({
  title,
  input,
}: {
  title: string
  input: string
}): JSX.Element => {
  return (
    <Stack
      direction={{ base: 'column', md: 'row' }}
      spacing={{ base: 0, md: '1.5rem' }}
    >
      <Text textStyle="body-2" width="6.5rem" color="content.medium">
        {title}
      </Text>
      <Text textStyle="body-2" color="content.default">
        {input}
      </Text>
    </Stack>
  )
}

// Extract selected product names for payment by products
const getProductNames = (products: ProductItem[]): string => {
  return products
    .filter((product) => product.selected)
    .map((product) => `${product.quantity}x ${product.data.name}`)
    .join(', ')
}

export const DownloadReceiptBlock = ({
  formId,
  submissionId,
  paymentId,
  amount,
  products,
  paymentType,
  name,
  paymentDate,
}: DownloadReceiptBlockProps) => {
  const toast = useToast({ status: 'success', isClosable: true })

  const formattedAmount = useMemo(() => `S$${centsToDollars(amount)}`, [amount])
  const paymentTimestamp = useMemo(
    () =>
      paymentDate
        ? format(new Date(paymentDate), 'dd MMM yyyy, HH:mm:ss z')
        : 'Payment date not found',
    [paymentDate],
  )
  const productName =
    paymentType === PaymentType.Products ? getProductNames(products) : name

  const handleInvoiceClick = () => {
    toast({
      description: 'Proof of payment download started',
    })
    window.location.href = getPaymentInvoiceDownloadUrl(formId, paymentId)
  }
  return (
    <Box>
      <Stack spacing="2rem">
        <Stack tabIndex={-1} spacing="0.75rem">
          <Text textStyle="h2" color="content.strong">
            Your payment has been made successfully.
          </Text>
          <Text textStyle="subhead-1" color="content.strong">
            Your form has been submitted and payment has been made.
          </Text>
        </Stack>
        <Divider />
        <Stack>
          <Text textStyle="h2" mb="0.5rem" color="content.strong">
            Payment summary
          </Text>
          <PaymentSummaryRow title="Product/service" input={productName} />
          <PaymentSummaryRow title="Amount" input={formattedAmount} />
          <PaymentSummaryRow title="Date" input={paymentTimestamp} />
          <PaymentSummaryRow title="Response ID" input={submissionId} />
        </Stack>
      </Stack>

      <Button
        mt="2.75rem"
        width={{ base: '100%', md: 'auto' }}
        leftIcon={<BiDownload fontSize="1.5rem" />}
        onClick={handleInvoiceClick}
      >
        Save proof of payment
      </Button>
    </Box>
  )
}
