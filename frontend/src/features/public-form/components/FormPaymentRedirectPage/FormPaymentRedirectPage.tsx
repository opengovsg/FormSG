import { BiDownload } from 'react-icons/bi'
import { Box, Container, Flex, Skeleton, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { usePublicFormContext } from '../../PublicFormContext'
import { useGetPaymentReceipt } from '../../queries'

import { PaymentSuccessSvgr } from './components/PaymentSuccessSvgr'

type FormPaymentRedirectPageProps = {
  stripeSubmissionId: string
}

export const FormPaymentRedirectPage = ({
  stripeSubmissionId,
}: FormPaymentRedirectPageProps) => {
  const { formId } = usePublicFormContext()

  const { data, isLoading } = useGetPaymentReceipt(formId, stripeSubmissionId)

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
            <Skeleton isLoaded={!isLoading}>
              <Stack tabIndex={-1} spacing="1rem">
                <Text textStyle="h2" textColor="secondary.500">
                  {data?.receipt
                    ? 'Your payment has been made successfully.'
                    : 'There was an error with your payment'}
                </Text>
                <Text textStyle="subhead-1" textColor="secondary.500">
                  {data?.receipt
                    ? 'Your form has been submitted and payment has been made.'
                    : 'Please resubmit the form or contact the agency which gave you this form link for further assistance.'}
                </Text>
              </Stack>
              <Text textColor="secondary.300" mt="2rem">
                Response ID: {stripeSubmissionId}
              </Text>
              {data?.receipt ? (
                <Button
                  mt="2.25rem"
                  leftIcon={<BiDownload fontSize="1.5rem" />}
                  as="a"
                  download
                  href={data.receipt}
                  target="_blank"
                >
                  Save payment receipt
                </Button>
              ) : null}
            </Skeleton>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}
