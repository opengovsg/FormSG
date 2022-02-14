import { Flex } from '@chakra-ui/react'

import FormFields from './components/FormFields'
import FormStartPage from './components/FormStartPage'
import { VerifiedFieldsProvider } from './verified-fields/VerifiedFieldsProvider'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  return (
    <PublicFormProvider>
      <VerifiedFieldsProvider>
        <Flex flexDir="column" h="100%" minH="100vh">
          <FormStartPage />
          <FormFields />
        </Flex>
      </VerifiedFieldsProvider>
    </PublicFormProvider>
  )
}

export default PublicFormPage
