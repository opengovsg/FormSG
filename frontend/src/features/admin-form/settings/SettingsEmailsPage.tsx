import { Skeleton } from '@chakra-ui/react'

import { FormResponseMode, FormSettings } from '~shared/types/form'

import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { CategoryHeader } from './components/CategoryHeader'
import { FormEmailSection } from './components/FormEmailSection'
import { MrfFormEmailSection } from './components/MrfFormEmailSection'
import { useAdminFormSettings } from './queries'

const FormEmailSectionSkeleton = (): JSX.Element => {
  return (
    <Skeleton>
      <FormLabel>Send an email copy of new responses</FormLabel>
      <TagInput placeholder="me@example.com" isDisabled />
    </Skeleton>
  )
}

interface FormEmailSectionContainerProps {
  settings: FormSettings
}

const FormEmailSectionContainer = ({
  settings,
}: FormEmailSectionContainerProps): JSX.Element => {
  if (settings.responseMode === FormResponseMode.Multirespondent) {
    return <MrfFormEmailSection settings={settings} />
  } else {
    return <FormEmailSection settings={settings} />
  }
}

export const SettingsEmailsPage = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()

  return (
    <>
      <CategoryHeader>Email notifications</CategoryHeader>
      {settings ? (
        <FormEmailSectionContainer settings={settings} />
      ) : (
        <FormEmailSectionSkeleton />
      )}
    </>
  )
}
