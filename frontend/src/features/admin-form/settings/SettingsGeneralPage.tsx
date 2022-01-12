import { Divider } from '@chakra-ui/react'

import { FormCaptchaToggle } from './components/FormCaptchaToggle'
import { FormCustomisationSection } from './components/FormCustomisationSection'
import { FormDetailsSection } from './components/FormDetailsSection'
import { FormLimitToggle } from './components/FormLimitToggle'
import { FormStatusToggle } from './components/FormStatusToggle'
import { GeneralTabHeader } from './components/GeneralTabHeader'
import { SubcategoryHeader } from './components/SubcategoryHeader'

export const SettingsGeneralPage = (): JSX.Element => {
  return (
    <>
      <GeneralTabHeader />
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
