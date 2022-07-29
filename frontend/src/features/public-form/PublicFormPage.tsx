import { useParams } from 'react-router-dom'

import FormEndPage from './components/FormEndPage'
import FormFields from './components/FormFields'
import { FormSectionsProvider } from './components/FormFields/FormSectionsContext'
import { FormFooter } from './components/FormFooter'
import FormInstructions from './components/FormInstructions'
import FormStartPage from './components/FormStartPage'
import { PublicFormWrapper } from './components/PublicFormWrapper'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return (
    <PublicFormProvider formId={formId}>
      <FormSectionsProvider>
        <FormStartPage />
        <PublicFormWrapper>
          <FormInstructions />
          <FormFields />
          <FormEndPage />
          <FormFooter />
        </PublicFormWrapper>
      </FormSectionsProvider>
    </PublicFormProvider>
  )
}

export default PublicFormPage
