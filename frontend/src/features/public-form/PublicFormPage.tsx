import { useParams } from 'react-router-dom'

import FormEndPage from './components/FormEndPage'
import FormFields from './components/FormFields'
import { FormFooter } from './components/FormFooter'
import FormStartPage from './components/FormStartPage'
import { PublicFormWrapper } from './components/PublicFormWrapper'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return (
    <PublicFormProvider formId={formId}>
      <FormStartPage />
      <PublicFormWrapper>
        <FormFields />
        <FormEndPage />
        <FormFooter />
      </PublicFormWrapper>
    </PublicFormProvider>
  )
}

export default PublicFormPage
