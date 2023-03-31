import { Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Container, Flex, Skeleton, Text } from '@chakra-ui/react'

import { fillMinHeightCss } from '~utils/fillHeightCss'

import { FormBanner } from '~features/public-form/components/FormBanner'
import { FormSectionsProvider } from '~features/public-form/components/FormFields/FormSectionsContext'
import { FormFooter } from '~features/public-form/components/FormFooter'
import { PublicFormLogo } from '~features/public-form/components/FormLogo'
import FormStartPage from '~features/public-form/components/FormStartPage'
import { PublicFormWrapper } from '~features/public-form/components/PublicFormWrapper'
import { PublicFormProvider } from '~features/public-form/PublicFormProvider'

import StripeElementWrapper from './stripe/StripeElementWrapper'

export interface FormPaymentPageProps {
  submissionId: string
  paymentClientSecret: string
  publishableKey: string
  isRetry?: boolean
}

export const FormPaymentPage = () => {
  const { formId, paymentPageId } = useParams()

  if (!formId) throw new Error('No formId provided')
  if (!paymentPageId) throw new Error('No paymentPageId provided')

  return (
    <PublicFormProvider formId={formId}>
      <FormSectionsProvider>
        <Flex direction="column" css={fillMinHeightCss}>
          <FormBanner />
          <PublicFormLogo />
          <FormStartPage />
          <PublicFormWrapper>
            <Box py={{ base: '1.5rem', md: '2.5rem' }} w="100%">
              <Container w="42.5rem" maxW="100%" p={0}>
                <Suspense
                  fallback={
                    <Skeleton w={'100%'} h={'350px'}>
                      <Text w={'100%'} textStyle="h3" textColor="primary.500">
                        Loading Payment Information
                      </Text>
                    </Skeleton>
                  }
                >
                  <StripeElementWrapper paymentPageId={paymentPageId} />
                </Suspense>
              </Container>
            </Box>
            <FormFooter />
          </PublicFormWrapper>
        </Flex>
      </FormSectionsProvider>
    </PublicFormProvider>
  )
}
