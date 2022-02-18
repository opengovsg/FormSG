import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import FormFields from './components/FormFields'
import FormStartPage from './components/FormStartPage'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return (
    <PublicFormProvider formId={formId}>
      <Flex flexDir="column" h="100%" minH="100vh">
        <FormStartPage />
        <FormFields />
      </Flex>
    </PublicFormProvider>
  )
}

export default PublicFormPage
