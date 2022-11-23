import { Container, Flex, Stack, StackDivider } from '@chakra-ui/react'

import { CreatePaymentIntentFailureBlock } from './components/CreatePaymentIntentFailureBlock'
import { PaymentPageBlock } from './components/PaymentPageBlock'

export interface FormPaymentPageProps {
  submissionId: string
  paymentClientSecret: string
  isRetry?: boolean
}

export const FormPaymentPage = (props: FormPaymentPageProps): JSX.Element => {
  return (
    <Container w="42.5rem" maxW="100%" p={0}>
      <Flex flexDir="column" align="center">
        <Stack
          spacing={{ base: '1.5rem', md: '3rem' }}
          py={{ base: '1.5rem', md: '3rem' }}
          px={{ base: '1.5rem', md: '4rem' }}
          bg="white"
          w="100%"
          divider={<StackDivider />}
        >
          {props.paymentClientSecret ? (
            <PaymentPageBlock focusOnMount {...props} />
          ) : (
            <CreatePaymentIntentFailureBlock focusOnMount {...props} />
          )}
        </Stack>
      </Flex>
    </Container>
  )
}
