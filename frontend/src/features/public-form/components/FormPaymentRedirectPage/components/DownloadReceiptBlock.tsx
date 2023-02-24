import { useCallback } from 'react'
import { BiDownload } from 'react-icons/bi'
import { Box, Stack, Text } from '@chakra-ui/react'

import Button from '../../../../../components/Button'
import { usePublicFormMutations } from '../../../mutations'

type DownloadReceiptBlockProps = {
  formId: string
  stripeSubmissionId: string
}

export const DownloadReceiptBlock = ({
  formId,
  stripeSubmissionId,
}: DownloadReceiptBlockProps) => {
  const { downloadPaymentReceiptMutation } = usePublicFormMutations(
    formId,
    stripeSubmissionId,
  )

  const handleClick = useCallback(() => {
    return downloadPaymentReceiptMutation.mutate()
  }, [downloadPaymentReceiptMutation])

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
        Response ID: {stripeSubmissionId}
      </Text>

      <Button
        mt="2.25rem"
        leftIcon={<BiDownload fontSize="1.5rem" />}
        isDisabled={downloadPaymentReceiptMutation.isLoading}
        isLoading={downloadPaymentReceiptMutation.isLoading}
        onClick={handleClick}
      >
        Save payment receipt
      </Button>
    </Box>
  )
}
