import { useMemo } from 'react'
import { BiDownload } from 'react-icons/bi'
import { Box, Divider, Flex, Stack, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import { FormDto, PaymentType, ProductItemForReceipt } from '~shared/types'
import { centsToDollars } from '~shared/utils/payments'

import { useToast } from '~hooks/useToast'
import Button from '~components/Button'

import { getPaymentInvoiceDownloadUrl } from '~features/public-form/utils/urls'

type DownloadReceiptBlockProps = {
  formId: string
  submissionId: string
  paymentId: string
  amount: number
  products: ProductItemForReceipt[]
  paymentType?: PaymentType
  name: string
  paymentDate: Date | null
  endPage: FormDto['endPage']
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
      mb={{ base: '0.5rem', md: 0 }}
    >
      <Text
        textStyle="body-1"
        width="6.5rem"
        color="secondary.400"
        mb={{ base: 0, md: '0.5rem' }}
      >
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
  name,
  quantity,
  amount_cents,
}: {
  name: string
  quantity: number
  amount_cents: number
}) => {
  return (
    <Flex textStyle="body-1" justifyContent="space-between">
      <Text
        fontWeight="400"
        color="secondary.700"
        width={{ base: '9.81rem', md: '26.69rem' }}
      >
        {name} x {quantity}
      </Text>
      <Text fontWeight="500" color="secondary.700">
        S${centsToDollars(quantity * amount_cents)}
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
  paymentDate,
  endPage,
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
      <Box
        bg="white"
        py={{ base: '1.5rem', md: '2rem' }}
        px={{ base: '1rem', md: '2rem' }}
      >
        <Stack tabIndex={-1} spacing="0.75rem">
          <Text textStyle="h2" color="secondary.500">
            {endPage.paymentTitle ||
              'Thank you, your payment has been made successfully.'}
          </Text>
          <Text textStyle="subhead-1" color="secondary.500">
            {endPage.paymentParagraph ||
              'Your form has been submitted and payment has been made.'}
          </Text>
        </Stack>
      </Box>
      <Box
        mt="1.5rem"
        mb="1rem"
        py={{ base: '1.5rem', md: '2rem' }}
        px={{ base: '1rem', md: '2rem' }}
        bgColor="white"
      >
        <Stack>
          <Box mb="0.5rem" px={{ base: '0.5rem', md: '1.5rem' }}>
            <Text textStyle="h2" mb="1rem" color="secondary.500">
              Details
            </Text>
            <PaymentDetailsRow title="Payment date" input={paymentTimestamp} />
            <PaymentDetailsRow title="Response ID" input={submissionId} />
          </Box>
          <Box
            bgColor="primary.100"
            flexDir="row"
            justifyContent="space-between"
            py="1rem"
            px="1.5rem"
          >
            <Text textStyle="h2" mb="1rem" color="secondary.500">
              Summary
            </Text>
            <Stack spacing="0.75rem" mb="1rem">
              {products.map((product, index) => (
                <LineItem
                  key={index}
                  name={product.name}
                  quantity={product.quantity}
                  amount_cents={product.amount_cents}
                />
              ))}
            </Stack>
            <Divider />
            <Stack mt="1rem">
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
