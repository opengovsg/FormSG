import { Container, Flex, Stack, StackDivider } from '@chakra-ui/react'

import { FormColorTheme, FormDto } from '~shared/types/form'

import { SubmissionData } from '~features/public-form/PublicFormContext'

import { PaymentPageBlock } from './components/PaymentPageBlock'

export interface FormPaymentPageProps {
  formTitle: FormDto['title']
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  colorTheme: FormColorTheme
  paymentClientSecret?: string
}

export const FormPaymentPage = ({
  colorTheme,
  paymentClientSecret,
  ...endPageProps
}: FormPaymentPageProps): JSX.Element => {
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
          <PaymentPageBlock
            focusOnMount
            {...endPageProps}
            colorTheme={colorTheme}
            paymentClientSecret={paymentClientSecret}
          />
        </Stack>
      </Flex>
    </Container>
  )
}
