import { FormControl, Skeleton } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { CategoryHeader } from './components/CategoryHeader'
import { EmailFormSection } from './components/EmailFormSection'
import { useAdminFormSettings } from './queries'

const AdminEmailSection = () => {
  const { data: settings } = useAdminFormSettings()

  if (!settings) {
    return <EmailFormSectionSkeleton />
  }

  const isEmailOrStorageMode =
    settings?.responseMode === FormResponseMode.Email ||
    settings?.responseMode === FormResponseMode.Encrypt

  // should render null
  if (!isEmailOrStorageMode) {
    return null
  }

  return <EmailFormSection settings={settings} />
}

const EmailFormSectionSkeleton = (): JSX.Element => {
  return (
    <FormControl isRequired>
      <FormLabel>Send an email copy of new responses</FormLabel>
      <Skeleton>
        <TagInput placeholder="me@example.com" isDisabled />
      </Skeleton>
    </FormControl>
  )
}

export const SettingsEmailsPage = (): JSX.Element => {
  return (
    <>
      <CategoryHeader>Email notifications</CategoryHeader>
      <AdminEmailSection />
    </>
  )
}
