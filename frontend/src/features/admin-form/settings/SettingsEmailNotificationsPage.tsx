import { Skeleton, Stack, Wrap } from '@chakra-ui/react'

import { CategoryHeader } from './components/CategoryHeader'
import { EmailFormSection } from './components/EmailFormSection'
import {
  isEmailMode,
  isEmailOrStorageMode,
  useAdminFormSettings,
} from './queries'

export const EmailSection = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Stack spacing="2rem">
        {settings && isEmailOrStorageMode(settings) ? (
          <EmailFormSection
            emails={settings.emails}
            isRequired={isEmailMode(settings)}
          />
        ) : null}
      </Stack>
    </Skeleton>
  )
}
export const SettingsEmailNotificationsPage = (): JSX.Element => {
  return (
    <>
      <Wrap
        shouldWrapChildren
        spacing="0.5rem"
        justify="space-between"
        mb="2.5rem"
      >
        <CategoryHeader mb={0} mr="2rem">
          Email notifications
        </CategoryHeader>
      </Wrap>
      <EmailSection />
    </>
  )
}
