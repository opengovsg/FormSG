import { Box } from '@chakra-ui/react'

import { HttpError } from '~services/ApiService'

import FormStartPage from './components/FormStartPage'
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
    <Box>
      <FormStartPage />
    </Box>
  )
}
