import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { fillMinHeightCss } from '~utils/fillHeightCss'

import { FormBanner } from './components/FormBanner'
import FormEndPage from './components/FormEndPage'
import FormFields from './components/FormFields'
import { FormSectionsProvider } from './components/FormFields/FormSectionsContext'
import { FormFooter } from './components/FormFooter'
import FormInstructions from './components/FormInstructions'
import FormIssueFeedback from './components/FormIssueFeedback'
import { PublicFormLogo } from './components/FormLogo'
import FormStartPage from './components/FormStartPage'
import LanguageControl from './components/LanguageControl'
import { PublicFormWrapper } from './components/PublicFormWrapper'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  const { formId, submissionId } = useParams()

  if (!formId) throw new Error('No formId provided')

  // Get date time in miliseconds when user first loads the form
  const startTime = Date.now()

  return (
    <PublicFormProvider
      formId={formId}
      submissionId={submissionId}
      startTime={startTime}
    >
      <FormSectionsProvider>
        <Flex direction="column" css={fillMinHeightCss}>
          <FormBanner />
          <PublicFormLogo />
          <FormStartPage />
          <LanguageControl />
          <PublicFormWrapper>
            <FormInstructions />
            <FormFields />
            <FormIssueFeedback />
            <FormEndPage />
            <FormFooter />
          </PublicFormWrapper>
        </Flex>
      </FormSectionsProvider>
    </PublicFormProvider>
  )
}

export default PublicFormPage
