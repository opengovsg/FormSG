import { useEffect, useState } from 'react'
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
import { PublicFormWrapper } from './components/PublicFormWrapper'
import ZoomControl from './components/ZoomControl'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  const { formId, submissionId } = useParams()
  const [rootFontSize, setRootFontSize] = useState('16px')

  const setDefaultSize = () => {
    setRootFontSize('16px')
  }

  const setLargeSize = () => {
    setRootFontSize('18px')
  }

  const setLargestSize = () => {
    setRootFontSize('24px')
  }

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('font-size', rootFontSize)

    // need to reset on unmount
    return () => {
      root.style.removeProperty('font-size')
    }
  }, [rootFontSize])

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
          <ZoomControl
            setDefaultSize={setDefaultSize}
            setLargeSize={setLargeSize}
            setLargestSize={setLargestSize}
          />
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
