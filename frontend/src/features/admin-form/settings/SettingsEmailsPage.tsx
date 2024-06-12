import { Skeleton, Stack, Wrap } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import { CategoryHeader } from './components/CategoryHeader'
import { EmailFormSection } from './components/EmailFormSection'
import { useAdminFormSettings } from './queries'

const AdminEmailSection = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const isEmailOrStorageMode =
    settings?.responseMode === FormResponseMode.Email ||
    settings?.responseMode === FormResponseMode.Encrypt

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Stack spacing="2rem">
        {settings && isEmailOrStorageMode ? (
          <EmailFormSection settings={settings} />
        ) : null}
      </Stack>
    </Skeleton>
  )
}
export const SettingsEmailsPage = (): JSX.Element => {
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
      <AdminEmailSection />
    </>
  )
}
