import { Flex } from '@chakra-ui/react'

import FormFields from './components/FormFields'
import FormStartPage from './components/FormStartPage'
import { VerifiedFormFieldsProvider } from './verified-fields/VerifiedFormFieldsProvider'
import { PublicFormProvider } from './PublicFormProvider'

export const PublicFormPage = (): JSX.Element => {
  return (
    <PublicFormProvider>
      <VerifiedFormFieldsProvider>
        <Flex flexDir="column" h="100%" minH="100vh">
          <FormStartPage />
          <FormFields />
        </Flex>
      </VerifiedFormFieldsProvider>
    </PublicFormProvider>
  )
}

export default PublicFormPage
