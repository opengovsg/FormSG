import { useMemo } from 'react'
import { BiDownload } from 'react-icons/bi'
import { Box, Divider, Flex, Stack, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import {
  ExtractTypeFromArray,
  GetPaymentInfoDto,
  PaymentType,
  ProductItem,
} from '~shared/types'
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

const PaymentDetailsRow = ({
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
      <Text textStyle="body-1" width="6.5rem" color="secondary.400">
        {title}
      </Text>
      <Text textStyle="body-1" color="secondary.700">
        {input}
      </Text>
    </Stack>
  )
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
      direction="row"
      spacing={{ base: 0, md: '3rem' }}
      justify="space-between"
    >
      <Text
        textStyle="body-1"
        width="6.5rem"
        color="secondary.700"
        fontWeight="400"
      >
        {title}
      </Text>
      <Text textStyle="body-1" color="secondary.700" fontWeight="500">
        {input}
      </Text>
    </Stack>
  )
}

const LineItem = ({
  productItem,
}: {
  productItem: ExtractTypeFromArray<NonNullable<GetPaymentInfoDto['products']>>
}) => {
  return (
    <Flex textStyle="body-1" mb="1rem" justifyContent="space-between">
      <Text fontWeight="400" color="secondary.700">
        {productItem.data.name} x {productItem.quantity}
      </Text>
      <Text fontWeight="500" color="secondary.700">
        S${centsToDollars(productItem.quantity * productItem.data.amount_cents)}
      </Text>
    </Flex>
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

  const totalAmount = useMemo(() => `S$${centsToDollars(amount)}`, [amount])
  const paymentTimestamp = useMemo(
    () =>
      paymentDate
        ? format(new Date(paymentDate), 'dd MMM yyyy, HH:mm:ss z')
        : 'Payment date not found',
    [paymentDate],
  )

  const handleInvoiceClick = () => {
    toast({
      description: 'Proof of payment download started',
    })
    window.location.href = getPaymentInvoiceDownloadUrl(formId, paymentId)
  }
  return (
    <>
      <Box bg="white" p="2rem">
        <Stack tabIndex={-1} spacing="0.75rem">
          <Text textStyle="h2" color="secondary.500">
            Thank you, your payment has been made successfully.
          </Text>
          <Text textStyle="subhead-1" color="secondary.500">
            Your form has been submitted and payment has been made.
          </Text>
        </Stack>
      </Box>
      <Box mt="2rem" px="1rem" py="2rem" bgColor="white">
        <Stack>
          <Box mb="1.5rem" px="1.5rem">
            <Text textStyle="h2" mb="0.5rem" color="secondary.500">
              Payment details
            </Text>
            <PaymentDetailsRow title="Payment date" input={paymentTimestamp} />
            <PaymentDetailsRow title="Response ID" input={submissionId} />
          </Box>
          <Box
            bgColor="primary.100"
            flexDir="row"
            justifyContent="space-between"
            mb="1rem"
            py="1rem"
            px="1.5rem"
          >
            <Text textStyle="h2" mb="0.5rem" color="secondary.500">
              Summary
            </Text>
            <Stack spacing="0.75rem" my="1rem">
              {products.map((product) => (
                <LineItem productItem={product} />
              ))}
            </Stack>
            <Divider />
            <Stack my="1rem">
              <PaymentSummaryRow title="Total" input={totalAmount} />
            </Stack>
          </Box>
        </Stack>

        <Stack mx={{ base: '0', md: '1.5rem' }} mt="1.5rem">
          <Button
            w="100%"
            leftIcon={<BiDownload fontSize="1.5rem" />}
            onClick={handleInvoiceClick}
          >
            Save proof of payment
          </Button>
        </Stack>
      </Box>
    </>
  )
}
