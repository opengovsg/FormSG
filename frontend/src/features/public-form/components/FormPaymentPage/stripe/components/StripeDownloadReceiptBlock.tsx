import { BiDownload } from 'react-icons/bi'
import { Box, Stack, Text } from '@chakra-ui/react'

import { useToast } from '~hooks/useToast'
import Button from '~components/Button'

import {
  getPaymentInvoiceDownloadUrl,
  getPaymentReceiptDownloadUrl,
} from '~features/public-form/utils/urls'

type DownloadReceiptBlockProps = {
  formId: string
  paymentId: string
}

export const DownloadReceiptBlock = ({
  formId,
  paymentId,
}: DownloadReceiptBlockProps) => {
  const toast = useToast({ status: 'success', isClosable: true })

  const handleReceiptClick = () => {
    toast({
      description: 'Receipt download started',
    })
    window.location.href = getPaymentReceiptDownloadUrl(formId, paymentId)
  }

  const handleInvoiceClick = () => {
    toast({
      description: 'Invoice download started',
    })
    window.location.href = getPaymentInvoiceDownloadUrl(formId, paymentId)
  }
  return (
    <Box>
      <Stack tabIndex={-1} spacing="1rem">
        <Text textStyle="h2" textColor="secondary.500">
          Your payment has been made successfully.
        </Text>
        <Text textStyle="subhead-1" textColor="secondary.500">
          Your form has been submitted and payment has been made.
        </Text>
      </Stack>
      <Text textColor="secondary.300" mt="2rem">
        Response ID: {paymentId}
      </Text>

      <Button
        hidden // Currently hidden for JTC
        mt="2.25rem"
        mr="2.25rem"
        leftIcon={<BiDownload fontSize="1.5rem" />}
        onClick={handleReceiptClick}
      >
        Save payment receipt
      </Button>
      <Button
        mt="2.25rem"
        leftIcon={<BiDownload fontSize="1.5rem" />}
        onClick={handleInvoiceClick}
      >
        Save payment invoice
      </Button>
    </Box>
  )
}
