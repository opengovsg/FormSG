import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { fillMinHeightCss } from '~utils/fillHeightCss'

import { FormBanner } from './components/FormBanner'
import FormEndPage from './components/FormEndPage'
import { FormPaymentPage } from './components/FormEndPage/FormPaymentPage'
import FormFields from './components/FormFields'
import { FormSectionsProvider } from './components/FormFields/FormSectionsContext'
import { FormFooter } from './components/FormFooter'
import FormInstructions from './components/FormInstructions'
import { PublicFormLogo } from './components/FormLogo'
import { FormPaymentRedirectPage } from './components/FormPaymentRedirectPage/FormPaymentRedirectPage'
import FormStartPage from './components/FormStartPage'
import { PublicFormWrapper } from './components/PublicFormWrapper'
import {
  RETRY_PAYMENT_KEY,
  STRIPE_PAYMENT_SECRET_KEY,
  STRIPE_SUBMISSION_ID_KEY,
} from './constants'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  const { formId } = useParams()

  if (!formId) throw new Error('No formId provided')

  const [searchParams] = useSearchParams()
  const { stripeSubmissionId, retryPayment, clientSecret } = useMemo(() => {
    return {
      stripeSubmissionId: searchParams.get(STRIPE_SUBMISSION_ID_KEY),
      retryPayment: searchParams.get(RETRY_PAYMENT_KEY) === 'true',
      clientSecret: searchParams.get(STRIPE_PAYMENT_SECRET_KEY),
    }
  }, [searchParams])

  return (
    <PublicFormProvider formId={formId}>
      <FormSectionsProvider>
        <Flex direction="column" css={fillMinHeightCss}>
          <FormBanner />
          <PublicFormLogo />
          <FormStartPage />
          <PublicFormWrapper>
            {retryPayment && stripeSubmissionId && clientSecret ? (
              <FormPaymentPage
                isRetry
                submissionId={stripeSubmissionId}
                paymentClientSecret={clientSecret}
                // TODO: Fix for retry payment
                publishableKey=""
              />
            ) : stripeSubmissionId ? (
              <FormPaymentRedirectPage
                stripeSubmissionId={stripeSubmissionId}
              />
            ) : (
              <>
                <FormInstructions />
                <FormFields />
                <FormEndPage />
              </>
            )}
            <FormFooter />
          </PublicFormWrapper>
        </Flex>
      </FormSectionsProvider>
    </PublicFormProvider>
  )
}

export default PublicFormPage
