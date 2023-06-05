import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { fillMinHeightCss } from '~utils/fillHeightCss'

import { FormBanner } from './components/FormBanner'
import FormEndPage from './components/FormEndPage'
import FormFields from './components/FormFields'
import { FormSectionsProvider } from './components/FormFields/FormSectionsContext'
import { FormFooter } from './components/FormFooter'
import FormInstructions from './components/FormInstructions'
import { PublicFormLogo } from './components/FormLogo'
import FormStartPage from './components/FormStartPage'
import { PublicFormWrapper } from './components/PublicFormWrapper'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  const { formId } = useParams()

  if (!formId) throw new Error('No formId provided')

  // Get date time in miliseconds when user first loads the form
  const startTime = Date.now()

  return (
    <PublicFormProvider formId={formId} startTime={startTime}>
      <FormSectionsProvider>
        <Flex direction="column" css={fillMinHeightCss}>
          <FormBanner />
          <PublicFormLogo />
          <FormStartPage />
          <PublicFormWrapper>
            <FormInstructions />
            <FormFields />
            <FormEndPage />

            <FormFooter />
          </PublicFormWrapper>
        </Flex>
      </FormSectionsProvider>
    </PublicFormProvider>
  )
}

export default PublicFormPage
