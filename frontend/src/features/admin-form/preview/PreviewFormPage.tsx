import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'
import { RestrictedGovtMasthead } from '@opengovsg/design-system-react'

import FormIssueFeedback from '~/features/public-form/components/FormIssueFeedback'

import { fillHeightCss } from '~utils/fillHeightCss'

import FormEndPage from '~features/public-form/components/FormEndPage'
import FormFields from '~features/public-form/components/FormFields'
import { FormSectionsProvider } from '~features/public-form/components/FormFields/FormSectionsContext'
import { FormFooter } from '~features/public-form/components/FormFooter'
import FormInstructions from '~features/public-form/components/FormInstructions'
import { PublicFormLogo } from '~features/public-form/components/FormLogo'
import FormStartPage from '~features/public-form/components/FormStartPage'
import { PublicFormWrapper } from '~features/public-form/components/PublicFormWrapper'

import { PreviewFormBannerContainer } from '../common/components/PreviewFormBanner'

import { PreviewFormProvider } from './PreviewFormProvider'

export const PreviewFormPage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return (
    <Flex flexDir="column" css={fillHeightCss} pos="relative">
      <PreviewFormProvider formId={formId}>
        <RestrictedGovtMasthead />
        <PreviewFormBannerContainer />
        <FormSectionsProvider>
          <PublicFormLogo />
          <FormStartPage />
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
