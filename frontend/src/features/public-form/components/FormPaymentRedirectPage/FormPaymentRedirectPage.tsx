import { BiDownload } from 'react-icons/bi'
import { Box, Container, Flex, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { PaymentSuccessSvgr } from './components/PaymentSuccessSvgr'

type FormPaymentRedirectPageProps = {
  stripeSubmissionId: string
}

export const FormPaymentRedirectPage = ({
  stripeSubmissionId,
}: FormPaymentRedirectPageProps) => {
  return (
    <Box py={{ base: '1.5rem', md: '2.5rem' }} w="100%">
      <Container w="42.5rem" maxW="100%" p={0}>
        <Flex flexDir="column" align="center">
          <PaymentSuccessSvgr maxW="100%" />
          <Box
            py={{ base: '1.5rem', md: '3rem' }}
            px={{ base: '1.5rem', md: '4rem' }}
            bg="white"
            w="100%"
          >
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
            <Button mt="2.25rem" leftIcon={<BiDownload fontSize="1.5rem" />}>
              Save payment receipt
            </Button>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}
