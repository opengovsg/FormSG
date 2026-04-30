import { useParams } from 'react-router-dom'
import { Flex, useDisclosure } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants/feature-flags'

import { fillHeightCss } from '~utils/fillHeightCss'
import GovtMasthead from '~components/GovtMasthead'

import FloatingToolBar from '~features/public-form/components/FloatingToolBar'
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
import {
  UseTemplateFrame,
  UseTemplateTour,
  UseTemplateWall,
  UseTemplateWallScrollTrigger,
} from './UseTemplateNudges'

export const TemplateFormPage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const isFrameOn = useFeatureIsOn(featureFlags.useTemplateFrame)
  const isTourOn = useFeatureIsOn(featureFlags.useTemplateTour)
  const isWallScrollOn = useFeatureIsOn(featureFlags.useTemplateWallScroll)
  const isWallSubmitOn = useFeatureIsOn(featureFlags.useTemplateWallSubmit)
  const isWallOn = isWallScrollOn || isWallSubmitOn

  const {
    isOpen: isWallOpen,
    onOpen: onWallOpen,
    onClose: onWallClose,
  } = useDisclosure()

  return (
    <Flex flexDir="column" css={fillHeightCss} pos="relative">
      {isFrameOn && <UseTemplateFrame />}
      <TemplateFormProvider
        formId={formId}
        onTemplatePreviewSubmitClick={isWallSubmitOn ? onWallOpen : undefined}
      >
        <GovtMasthead />
        <PreviewFormBannerContainer isTemplate />
        <FormSectionsProvider>
          <PublicFormLogo />
          <FormStartPage isTemplate />
          <PublicFormWrapper>
            <FormInstructions />
            <FormFields />
            <FloatingToolBar />
            <FormEndPage />
            <FormFooter />
          </PublicFormWrapper>
          {isWallScrollOn && (
            <UseTemplateWallScrollTrigger
              formId={formId}
              onTrigger={onWallOpen}
            />
          )}
          {isWallOn && (
            <UseTemplateWall
              formId={formId}
              isOpen={isWallOpen}
              onClose={onWallClose}
            />
          )}
        </FormSectionsProvider>
        {isTourOn && <UseTemplateTour />}
      </TemplateFormProvider>
    </Flex>
  )
}

export default TemplateFormPage
