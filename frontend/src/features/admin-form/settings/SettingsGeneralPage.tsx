import { Divider, Stack } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from '~shared/constants/feature-flags'

import { FormCaptchaToggle } from './components/FormCaptchaToggle'
import { FormCustomisationSection } from './components/FormCustomisationSection'
import { FormDetailsSection } from './components/FormDetailsSection'
import { FormIssueNotificationToggle } from './components/FormIssueNotificationToggle'
import { FormLimitToggle } from './components/FormLimitToggle'
import FormSaveDraftToggle from './components/FormSaveDraftToggle'
import { FormStatusToggle } from './components/FormStatusToggle'
import { GeneralTabHeader } from './components/GeneralTabHeader'

export const SettingsGeneralPage = (): JSX.Element => {
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
  const isSaveDraftFeatureEnabled = isTest || useFeatureIsOn(featureFlags.saveDraft)

  return (
    <Stack divider={<Divider />} spacing="2.5rem">
      <>
        <GeneralTabHeader />
        <FormStatusToggle />
        <FormLimitToggle />
        <FormCustomisationSection />
      </>
      {/* TODO [Save Draft v1.0]: Remove feature flagonce save draft is out of beta  */}
      {isSaveDraftFeatureEnabled && <FormSaveDraftToggle />}
      <FormCaptchaToggle />
      <FormIssueNotificationToggle />
      <FormDetailsSection />
    </Stack>
  )
}
