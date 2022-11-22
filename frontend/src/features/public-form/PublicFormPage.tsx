import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { fillMinHeightCss } from '~utils/fillHeightCss'

import { FormBanner } from './components/FormBanner'
import FormEndPage from './components/FormEndPage'
import FormFields from './components/FormFields'
import { FormSectionsProvider } from './components/FormFields/FormSectionsContext'
import { FormFooter } from './components/FormFooter'
import FormInstructions from './components/FormInstructions'
import { PublicFormLogo } from './components/FormLogo'
import { FormPaymentRedirectPage } from './components/FormPaymentRedirectPage/FormPaymentRedirectPage'
import FormStartPage from './components/FormStartPage'
import { PublicFormWrapper } from './components/PublicFormWrapper'
import { STRIPE_SUBMISSION_ID_KEY } from './constants'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  const { formId } = useParams()

  if (!formId) throw new Error('No formId provided')

  const [searchParams] = useSearchParams()
  const stripeSubmissionId = useMemo(
    () => searchParams.get(STRIPE_SUBMISSION_ID_KEY),
    [searchParams],
  )

  return (
    <PublicFormProvider formId={formId}>
      <FormSectionsProvider>
        <Flex direction="column" css={fillMinHeightCss}>
          <FormBanner />
          <PublicFormLogo />
          <FormStartPage />
          <PublicFormWrapper>
            {stripeSubmissionId ? (
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
