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

import StripePaymentElement from './stripe/StripePaymentElement'

export const FormPaymentPage = () => {
  const { formId, paymentId } = useParams()

  if (!formId) throw new Error('No formId provided')
  if (!paymentId) throw new Error('No paymentId provided')

  return (
    <PublicFormProvider startTime={Date.now()} formId={formId}>
      <FormSectionsProvider>
        <Flex direction="column" css={fillMinHeightCss}>
          <FormBanner />
          <PublicFormLogo />
          <FormStartPage />
          <PublicFormWrapper>
            <Box py="1rem" w="100%">
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
                  <StripePaymentElement paymentId={paymentId} />
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
