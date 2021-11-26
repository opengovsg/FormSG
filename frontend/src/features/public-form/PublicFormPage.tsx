import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { PUBLICFORM_REGEX } from '~constants/routes'
import { HttpError } from '~services/ApiService'

import FormFields from './components/FormFields'
import FormStartPage from './components/FormStartPage'
import { PublicFormProvider } from './PublicFormContext'
import { usePublicFormView } from './queries'

export const PublicFormPage = (): JSX.Element => {
  const { formId } = useParams()
  const { error } = usePublicFormView()

  if (
    !formId ||
    !PUBLICFORM_REGEX.test(formId) ||
    (error instanceof HttpError && error.code === 404)
  ) {
    return <div>404</div>
  }

  return (
    <PublicFormProvider>
      <Flex flexDir="column" h="100%" minH="100vh">
        <FormStartPage />
        <FormFields />
      </Flex>
    </PublicFormProvider>
  )
}
