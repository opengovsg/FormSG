import { Divider } from '@chakra-ui/react'

import { CategoryHeader } from './components/CategoryHeader'
import { FormCaptchaToggle } from './components/FormCaptchaToggle'
import { FormCustomisationSection } from './components/FormCustomisationSection'
import { FormDetailsSection } from './components/FormDetailsSection'
import { FormLimitToggle } from './components/FormLimitToggle'
import { FormStatusToggle } from './components/FormStatusToggle'
import { SubcategoryHeader } from './components/SubcategoryHeader'

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
