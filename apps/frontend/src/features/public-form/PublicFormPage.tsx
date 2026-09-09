import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { useToast } from '~hooks/useToast'
import { fillMinHeightCss } from '~utils/fillHeightCss'

import FloatingToolbar from './components/FloatingToolBar'
import { FormBanner } from './components/FormBanner'
import FormEndPage from './components/FormEndPage'
import FormFields from './components/FormFields'
import { FormSectionsProvider } from './components/FormFields/FormSectionsContext'
import { FormFooter } from './components/FormFooter'
import FormInstructions from './components/FormInstructions'
import { PublicFormLogo } from './components/FormLogo'
import FormStartPage from './components/FormStartPage'
import LanguageControl from './components/LanguageControl'
import { PublicFormWrapper } from './components/PublicFormWrapper'
import {
  clearExpectedAuthFormId,
  getExpectedAuthFormId,
} from './utils/authRedirectStorage'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  const { formId, submissionId } = useParams()
  const { t } = useTranslation()
  const toast = useToast({ isClosable: true })
  const location = useLocation()

  if (!formId) throw new Error('No formId provided')

  const expectedAuthFormId = getExpectedAuthFormId()

  useEffect(() => {
    if (!expectedAuthFormId) return

    if (expectedAuthFormId === formId) {
      clearExpectedAuthFormId()
      return
    }

    toast({
      status: 'danger',
      description: t('features.publicForm.errors.authFormMismatch'),
    })
  }, [expectedAuthFormId, formId, t, toast])

  if (expectedAuthFormId && expectedAuthFormId !== formId) {
    // Swap the mismatched formId in the current path (preserving any
    // subroute, e.g. edit/:submissionId) rather than dropping to form root.
    const redirectPath = location.pathname.replace(formId, expectedAuthFormId)
    return <Navigate replace to={`${redirectPath}${location.search}`} />
  }

  // Get date time in miliseconds when user first loads the form
  const startTime = Date.now()

  return (
    <PublicFormProvider
      formId={formId}
      submissionId={submissionId}
      startTime={startTime}
      isPublicFormPage
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
            <FloatingToolbar />
            <FormEndPage />
            <FormFooter />
          </PublicFormWrapper>
        </Flex>
      </FormSectionsProvider>
    </PublicFormProvider>
  )
}

export default PublicFormPage
