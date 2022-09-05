import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import GovtMasthead from '~components/GovtMasthead'

// TODO #4279: Remove after React rollout is complete
import { SwitchEnvIcon } from '~features/env/SwitchEnvIcon'
import FormEndPage from '~features/public-form/components/FormEndPage'
import FormFields from '~features/public-form/components/FormFields'
import { FormSectionsProvider } from '~features/public-form/components/FormFields/FormSectionsContext'
import { FormFooter } from '~features/public-form/components/FormFooter'
import FormInstructions from '~features/public-form/components/FormInstructions'
import FormStartPage from '~features/public-form/components/FormStartPage'
import { PublicFormWrapper } from '~features/public-form/components/PublicFormWrapper'

import { PreviewFormBanner } from '../common/components/PreviewFormBanner'

import { PreviewFormProvider } from './PreviewFormProvider'

export const PreviewFormPage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return (
    <Flex flexDir="column" height="100vh" pos="relative">
      <PreviewFormProvider formId={formId}>
        <GovtMasthead />
        <PreviewFormBanner />
        <SwitchEnvIcon />
        <FormSectionsProvider>
          <FormStartPage />
          <PublicFormWrapper isPreview>
            <FormInstructions />
            <FormFields />
            <FormEndPage isPreview />
            <FormFooter />
          </PublicFormWrapper>
        </FormSectionsProvider>
      </PreviewFormProvider>
    </Flex>
  )
}

export default PreviewFormPage
