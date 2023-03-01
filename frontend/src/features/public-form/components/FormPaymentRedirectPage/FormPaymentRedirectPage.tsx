import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Container, Flex, Skeleton } from '@chakra-ui/react'

import { usePublicFormContext } from '../../PublicFormContext'
import { useGetPaymentReceipt } from '../../queries'

import { DownloadReceiptBlock } from './components/DownloadReceiptBlock'
import { PaymentSuccessSvgr } from './components/PaymentSuccessSvgr'

type FormPaymentRedirectPageProps = {
  stripeSubmissionId: string
}

export const FormPaymentRedirectPage = ({
  stripeSubmissionId,
}: FormPaymentRedirectPageProps) => {
  const { formId } = usePublicFormContext()

  const { data, isLoading } = useGetPaymentReceipt(formId, stripeSubmissionId)

  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !data?.receipt) {
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('retryPayment', 'true')
      const urlPathAndSearch = currentUrl.pathname + currentUrl.search
      navigate(urlPathAndSearch)
    }
  }, [data, isLoading, navigate])

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
              {data?.receipt ? (
                <DownloadReceiptBlock
                  receiptUrl={data.receipt}
                  stripeSubmissionId={stripeSubmissionId}
                />
              ) : null}
            </Skeleton>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}
