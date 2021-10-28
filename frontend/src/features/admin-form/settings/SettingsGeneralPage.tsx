import { FC } from 'react'
import { Box, Divider, Text } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form/form'

import { EmailFormSection } from './components/EmailFormSection'
import { FormCaptchaToggle } from './components/FormCaptchaToggle'
import { FormCustomisationSection } from './components/FormCustomisationSection'
import { FormLimitToggle } from './components/FormLimitToggle'
import { FormStatusToggle } from './components/FormStatusToggle'
import { useAdminFormSettings } from './queries'

const CategoryHeader: FC = ({ children }) => {
  return (
    <Text as="h2" textStyle="h2" color="secondary.500" mb="2.5rem">
      {children}
    </Text>
  )
}

const SubcategoryHeader: FC = ({ children }) => {
  return (
    <Text
      as="h3"
      textTransform="uppercase"
      textStyle="subhead-3"
      color="primary.500"
      mb="2rem"
    >
      {children}
    </Text>
  )
}

export const SettingsGeneralPage = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()

  return (
    <Box maxW="42.5rem">
      <CategoryHeader>Respondent access</CategoryHeader>
      <FormStatusToggle />
      <Divider my="2.5rem" />
      <SubcategoryHeader>Scheduling</SubcategoryHeader>
      <FormLimitToggle />
      <Divider my="2.5rem" />
      <SubcategoryHeader>Customisation</SubcategoryHeader>
      <FormCustomisationSection />
      <Divider my="2.5rem" />
      <SubcategoryHeader>Verification</SubcategoryHeader>
      <FormCaptchaToggle />
      {settings?.responseMode === FormResponseMode.Email && (
        <>
          <Divider my="2.5rem" />
          <CategoryHeader>Responses recipients</CategoryHeader>
          <EmailFormSection settings={settings} />
        </>
      )}
    </Box>
  )
}
