import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Container, Flex, Skeleton } from '@chakra-ui/react'

import { fillMinHeightCss } from '~utils/fillHeightCss'

import { PublicFormProvider } from '~features/public-form/PublicFormProvider'

import { useGetPaymentReceiptStatus } from '../../queries'
import { FormBanner } from '../FormBanner'
import { FormSectionsProvider } from '../FormFields/FormSectionsContext'
import { FormFooter } from '../FormFooter'
import { PublicFormLogo } from '../FormLogo'
import FormStartPage from '../FormStartPage'
import { PublicFormWrapper } from '../PublicFormWrapper'

import { DownloadReceiptBlock } from './components/DownloadReceiptBlock'
import { PaymentSuccessSvgr } from './components/PaymentSuccessSvgr'

export const FormPaymentRedirectPage = () => {
  const { formId, stripeSubmissionId } = useParams()

  if (!formId) throw new Error('No formId provided')
  if (!stripeSubmissionId) throw new Error('No stripeSubmissionId provided')

  const [isReceiptReady, setIsReceiptReady] = useState(false)
  const { data, isLoading, error } = useGetPaymentReceiptStatus(
    formId,
    stripeSubmissionId,
    isReceiptReady,
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
                          stripeSubmissionId={stripeSubmissionId}
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
