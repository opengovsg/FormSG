import { FC } from 'react'
import { Divider, Text } from '@chakra-ui/react'

import { FormCaptchaToggle } from './components/FormCaptchaToggle'
import { FormCustomisationSection } from './components/FormCustomisationSection'
import { FormDetailsSection } from './components/FormDetailsSection'
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
    <>
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
      <SubcategoryHeader>Form Details</SubcategoryHeader>
      <FormDetailsSection />
    </>
  )
}
