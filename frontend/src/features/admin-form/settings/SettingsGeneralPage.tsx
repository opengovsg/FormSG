import { Divider, Stack } from '@chakra-ui/react'

import { FormCaptchaToggle } from './components/FormCaptchaToggle'
import { FormCustomisationSection } from './components/FormCustomisationSection'
import { FormDetailsSection } from './components/FormDetailsSection'
import { FormIssueNotificationToggle } from './components/FormIssueNotificationToggle'
import { FormLimitToggle } from './components/FormLimitToggle'
import { FormStatusToggle } from './components/FormStatusToggle'
import { GeneralTabHeader } from './components/GeneralTabHeader'

export const SettingsGeneralPage = (): JSX.Element => {
  return (
    <Stack divider={<Divider />} spacing="2.5rem">
      <>
        <GeneralTabHeader />
        <FormStatusToggle />
        <FormLimitToggle />
        <FormCustomisationSection />
      </>
      <FormCaptchaToggle />
      <FormIssueNotificationToggle />
      <FormDetailsSection />
    </Stack>
  )
}
