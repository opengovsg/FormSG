import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import FormIssueFeedback from '~/features/public-form/components/FormIssueFeedback'

import { fillHeightCss } from '~utils/fillHeightCss'
import GovtMasthead from '~components/GovtMasthead'

import FormEndPage from '~features/public-form/components/FormEndPage'
import FormFields from '~features/public-form/components/FormFields'
import { FormSectionsProvider } from '~features/public-form/components/FormFields/FormSectionsContext'
import { FormFooter } from '~features/public-form/components/FormFooter'
import FormInstructions from '~features/public-form/components/FormInstructions'
import { PublicFormLogo } from '~features/public-form/components/FormLogo'
import FormStartPage from '~features/public-form/components/FormStartPage'
import { PublicFormWrapper } from '~features/public-form/components/PublicFormWrapper'
import ZoomControl from '~features/public-form/components/ZoomControl'

import { PreviewFormBannerContainer } from '../common/components/PreviewFormBanner'

import { PreviewFormProvider } from './PreviewFormProvider'

export const PreviewFormPage = (): JSX.Element => {
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

  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return (
    <Flex flexDir="column" css={fillHeightCss} pos="relative">
      <PreviewFormProvider formId={formId}>
        <GovtMasthead />
        <PreviewFormBannerContainer />
        <FormSectionsProvider>
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
        </FormSectionsProvider>
      </PreviewFormProvider>
    </Flex>
  )
}

export default PreviewFormPage
