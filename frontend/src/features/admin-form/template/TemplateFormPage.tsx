import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

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

import { PreviewFormBannerContainer } from '../common/components/PreviewFormBanner'

import { TemplateFormProvider } from './TemplateFormProvider'

export const TemplateFormPage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return (
    <Flex flexDir="column" css={fillHeightCss} pos="relative">
      <TemplateFormProvider formId={formId}>
        <GovtMasthead />
        <PreviewFormBannerContainer isTemplate />
        <FormSectionsProvider>
          <PublicFormLogo />
          <FormStartPage isTemplate />
          <PublicFormWrapper>
            <FormInstructions />
            <FormFields isPreview />
            <FormEndPage isPreview />
            <FormFooter />
          </PublicFormWrapper>
        </FormSectionsProvider>
      </TemplateFormProvider>
    </Flex>
  )
}

export default TemplateFormPage
