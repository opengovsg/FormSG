import { FC } from 'react'
import { Box, Divider, Text } from '@chakra-ui/react'

import { FormCaptchaToggle } from './components/FormCaptchaToggle'
import { FormCustomisationSection } from './components/FormCustomisationSection'
import { FormLimitToggle } from './components/FormLimitToggle'
import { FormStatusToggle } from './components/FormStatusToggle'

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
      <Divider my="2.5rem" />
    </Box>
  )
}
