import { HttpError } from '~services/ApiService'

import FormStartPage from './components/FormStartPage'
import { PublicFormProvider } from './PublicFormContext'
import { usePublicFormView } from './queries'

export const PublicFormPage = (): JSX.Element => {
  const { isLoading, error } = usePublicFormView()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error instanceof HttpError && error.code === 404) {
    return <div>404</div>
  }

  return (
    <PublicFormProvider>
      <FormStartPage />
    </PublicFormProvider>
  )
}
