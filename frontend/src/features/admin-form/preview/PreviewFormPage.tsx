import { useParams } from 'react-router-dom'

import GovtMasthead from '~components/GovtMasthead'

import FormEndPage from '~features/public-form/components/FormEndPage'
import FormFields from '~features/public-form/components/FormFields'
import { FormFooter } from '~features/public-form/components/FormFooter'
import FormStartPage from '~features/public-form/components/FormStartPage'
import { PublicFormWithHeaderWrapper } from '~features/public-form/components/PublicFormWithHeaderWrapper'
import { PublicFormWrapper } from '~features/public-form/components/PublicFormWrapper'

import { PreviewFormHeader } from '../common/components/PreviewFormHeader/PreviewFormHeader'

import { PreviewFormProvider } from './PreviewFormProvider'

export const PreviewFormPage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return (
    <PreviewFormProvider formId={formId}>
      <GovtMasthead />
      <PublicFormWithHeaderWrapper>
        <PreviewFormHeader />
        <FormStartPage />
        <PublicFormWrapper>
          <FormFields />
          <FormEndPage isPreview />
          <FormFooter />
        </PublicFormWrapper>
      </PublicFormWithHeaderWrapper>
    </PreviewFormProvider>
  )
}

export default PreviewFormPage
