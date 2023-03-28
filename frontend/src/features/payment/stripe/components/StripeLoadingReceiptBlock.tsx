import { Box, Stack, Text } from '@chakra-ui/react'

type DownloadReceiptBlockProps = {
  paymentId: string
}

export const StripeLoadingReceiptBlock = ({
  paymentId,
}: DownloadReceiptBlockProps) => {
  return (
    <Box>
      <Stack tabIndex={-1} spacing="1rem">
        <Text textStyle="h2" textColor="secondary.500">
          Your payment has been made successfully.
        </Text>
        <Text textStyle="subhead-1" textColor="secondary.500">
          We're confirming your payment with Stripe
        </Text>
      </Stack>
      <Text textColor="secondary.300" mt="2rem">
        Response ID: {paymentId}
      </Text>
    </Box>
  )
}
