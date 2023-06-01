import { Box, Stack, Text } from '@chakra-ui/react'

type StripePaymentGenericMessageBlockProps = {
  submissionId: string
  title: string
  subtitle?: string
  children?: JSX.Element
}
export const GenericMessageBlock = ({
  submissionId,
  title,
  subtitle,
  children,
}: StripePaymentGenericMessageBlockProps) => {
  return (
    <Box>
      <Stack tabIndex={-1} spacing="1rem">
        <Text textStyle="h2" textColor="secondary.500">
          {title}
        </Text>
        <Text textStyle="subhead-1" textColor="secondary.500">
          {subtitle}
        </Text>
      </Stack>
      <Text textColor="secondary.300" mt="2rem">
        Response ID: {submissionId}
      </Text>
      {children}
    </Box>
  )
}
