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
  paymentDate?: Date
}

const PaymentSummaryItem = ({
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
      <Text textStyle="body-2" width="6.5rem" color="#848484">
        {title}
      </Text>
      <Text textStyle="body-2" color="#474747">
        {input}
      </Text>
    </Stack>
  )
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

  // Extract selected product names for payment by products
  const extractProductNames = (products: ProductItem[]) => {
    const productArray: string[] = []
    products.forEach((product) => {
      if (product.selected) {
        productArray.push(`${product.quantity}x ${product.data.name}`)
      }
    })
    return productArray.join(', ')
  }
  const formattedAmount = useMemo(() => `S$${centsToDollars(amount)}`, [amount])
  const paymentTimestamp = useMemo(
    () =>
      paymentDate
        ? format(new Date(paymentDate), 'dd MMM yyyy, HH:mm:ss z')
        : 'Payment date not found',
    [paymentDate],
  )
  const productName =
    paymentType === PaymentType.Products ? extractProductNames(products) : name

  const handleInvoiceClick = () => {
    toast({
      description: 'Proof of payment download started',
    })
    window.location.href = getPaymentInvoiceDownloadUrl(formId, paymentId)
  }
  return (
    <Box>
      <Stack spacing="2rem">
        <Stack tabIndex={-1} spacing="1rem">
          <Text textStyle="h2">Your payment has been made successfully.</Text>
          <Text textStyle="subhead-1">
            Your form has been submitted and payment has been made.
          </Text>
        </Stack>
        <Divider />
        <Stack>
          <Text textStyle="h2" mb="0.5rem">
            Payment summary
          </Text>
          <PaymentSummaryItem title="Product/service" input={productName} />
          <PaymentSummaryItem title="Amount" input={formattedAmount} />
          <PaymentSummaryItem title="Date" input={paymentTimestamp} />
          <PaymentSummaryItem title="Response ID" input={submissionId} />
        </Stack>
      </Stack>

      <Button
        mt="2.75rem"
        leftIcon={<BiDownload fontSize="1.5rem" />}
        onClick={handleInvoiceClick}
      >
        Save proof of payment
      </Button>
    </Box>
  )
}
