import { Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { Flex, Skeleton, Text } from '@chakra-ui/react'

import { fillMinHeightCss } from '~utils/fillHeightCss'

import { FormBanner } from '~features/public-form/components/FormBanner'
import { FormSectionsProvider } from '~features/public-form/components/FormFields/FormSectionsContext'
import { FormFooter } from '~features/public-form/components/FormFooter'
import { PublicFormProvider } from '~features/public-form/PublicFormProvider'

import { PaymentFormBannerLogo } from './components/PaymentFormBannerLogo'
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
          <PaymentFormBannerLogo />
          <Suspense fallback={<Skeleton w={'100%'} h={'350px'} />}>
            <StripePaymentElement paymentId={paymentId} />
          </Suspense>
          <FormFooter />
        </Flex>
      </FormSectionsProvider>
    </PublicFormProvider>
  )
}
