import { Flex } from '@chakra-ui/react'

import { HttpError } from '~services/ApiService'

import FormFields from './components/FormFields'
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
      <Flex flexDir="column" height="100%">
        <FormStartPage />
        <FormFields />
      </Flex>
    </PublicFormProvider>
  )
}
