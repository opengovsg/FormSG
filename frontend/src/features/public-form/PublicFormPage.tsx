import { useParams } from 'react-router-dom'

import FormEndPage from './components/FormEndPage'
import FormFields from './components/FormFields'
import { FormFooter } from './components/FormFooter'
import FormStartPage from './components/FormStartPage'
import { PublicFormWithHeaderWrapper } from './components/PublicFormWithHeaderWrapper'
import { PublicFormWrapper } from './components/PublicFormWrapper'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return (
    <PublicFormProvider formId={formId}>
      <PublicFormWithHeaderWrapper>
        <FormStartPage />
        <PublicFormWrapper>
          <FormFields />
          <FormEndPage />
          <FormFooter />
        </PublicFormWrapper>
      </PublicFormWithHeaderWrapper>
    </PublicFormProvider>
  )
}

export default PublicFormPage
