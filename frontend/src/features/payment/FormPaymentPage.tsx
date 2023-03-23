import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Container, Flex, Skeleton } from '@chakra-ui/react'

import { fillMinHeightCss } from '~utils/fillHeightCss'

import { FormBanner } from '~features/public-form/components/FormBanner'
import { FormSectionsProvider } from '~features/public-form/components/FormFields/FormSectionsContext'
import { FormFooter } from '~features/public-form/components/FormFooter'
import { PublicFormLogo } from '~features/public-form/components/FormLogo'
import { DownloadReceiptBlock } from '~features/public-form/components/FormPaymentRedirectPage/components/DownloadReceiptBlock'
import { PaymentSuccessSvgr } from '~features/public-form/components/FormPaymentRedirectPage/components/PaymentSuccessSvgr'
import FormStartPage from '~features/public-form/components/FormStartPage'
import { PublicFormWrapper } from '~features/public-form/components/PublicFormWrapper'
import { PublicFormProvider } from '~features/public-form/PublicFormProvider'

import { useGetPaymentInfo, useGetPaymentReceiptStatus } from './queries'

export const FormPaymentPage = () => {
  const { formId, paymentPageId } = useParams()

  if (!formId) throw new Error('No formId provided')
  if (!paymentPageId) throw new Error('No paymentPageId provided')

  const { data: paymentInfoData, error: paymentInfoError } =
    useGetPaymentInfo(paymentPageId)
  const { data, isLoading, error } = useGetPaymentReceiptStatus(
    formId,
    paymentPageId,
  )

  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && error) {
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('retryPayment', 'true')
      const urlPathAndSearch = currentUrl.pathname + currentUrl.search
      navigate(urlPathAndSearch)
    }
  }, [error, isLoading, navigate])

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
                <Flex flexDir="column" align="center">
                  <PaymentSuccessSvgr maxW="100%" />
                  <Box
                    py={{ base: '1.5rem', md: '3rem' }}
                    px={{ base: '1.5rem', md: '4rem' }}
                    bg="white"
                    w="100%"
                  >
                    <Skeleton isLoaded={!isLoading}>
                      {data?.isReady ? (
                        <DownloadReceiptBlock
                          formId={formId}
                          stripeSubmissionId={paymentPageId}
                        />
                      ) : null}
                    </Skeleton>
                  </Box>
                </Flex>
              </Container>
            </Box>
            <FormFooter />
          </PublicFormWrapper>
        </Flex>
      </FormSectionsProvider>
    </PublicFormProvider>
  )
}
