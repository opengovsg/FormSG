import { Divider } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import { useUser } from '~features/user/queries'

import { StatusTrackerToggle } from './components/EmailNotificationsSection/StatusTrackerToggle'
import { FormCaptchaToggle } from './components/FormCaptchaToggle'
import { FormCustomisationSection } from './components/FormCustomisationSection'
import { FormDetailsSection } from './components/FormDetailsSection'
import { FormIssueNotificationToggle } from './components/FormIssueNotificationToggle'
import { FormLimitToggle } from './components/FormLimitToggle'
import { FormStatusToggle } from './components/FormStatusToggle'
import { GeneralTabHeader } from './components/GeneralTabHeader'
import { useAdminFormSettings } from './queries'

export const SettingsGeneralPage = (): JSX.Element => {
  const { user } = useUser()
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
  const { data: settings } = useAdminFormSettings()

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
      {isTest ||
      (user?.betaFlags?.statusTracker &&
        settings?.responseMode === FormResponseMode.Multirespondent) ? (
        <>
          <Divider my="2.5rem" />
          <StatusTrackerToggle />
        </>
      ) : null}
    </>
  )
}
