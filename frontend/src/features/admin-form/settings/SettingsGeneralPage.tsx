import { Divider } from '@chakra-ui/react'

import { FormCaptchaToggle } from './components/FormCaptchaToggle'
import { FormCustomisationSection } from './components/FormCustomisationSection'
import { FormDetailsSection } from './components/FormDetailsSection'
import { FormIssueNotificationToggle } from './components/FormIssueNotificationToggle'
import { FormLimitToggle } from './components/FormLimitToggle'
import { FormStatusToggle } from './components/FormStatusToggle'
import { GeneralTabHeader } from './components/GeneralTabHeader'

export const SettingsGeneralPage = (): JSX.Element => {
  return (
    <>
      <GeneralTabHeader />
      <FormStatusToggle />
      <FormLimitToggle />
      <FormCustomisationSection />
      <Divider my="2.5rem" />
      <FormCaptchaToggle />
      <Divider my="2.5rem" />
      <FormIssueNotificationToggle />
      <Divider my="2.5rem" />
      <FormDetailsSection />
    </>
  )
}
