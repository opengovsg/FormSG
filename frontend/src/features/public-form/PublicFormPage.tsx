import { useParams } from 'react-router-dom'
import { Flex } from '@chakra-ui/react'

import { AppMasthead } from '~components/GovtMasthead'

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
    <Flex minH="100vh" flexDir="column" h="100%">
      <AppMasthead />
      <PublicFormProvider formId={formId}>
        <FormStartPage />
        <PublicFormWrapper>
          <FormFields />
          <FormEndPage />
          <FormFooter />
        </PublicFormWrapper>
      </PublicFormProvider>
    </Flex>
  )
}

export default PublicFormPage
