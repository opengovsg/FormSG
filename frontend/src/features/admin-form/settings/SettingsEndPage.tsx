import { Skeleton } from '@chakra-ui/react'

import { useAdminForm } from '../common/queries'

import { CategoryHeader } from './components/CategoryHeader'
import { EndPageSettingsInput } from './components/EndPageSettingsSection/EndPageSettingsInput'

export const SettingsEndPage = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()

  return (
    <>
      <CategoryHeader mb={0}>Customise Thank You page</CategoryHeader>
      <Skeleton isLoaded={!isLoading && !!form}>
        {form ? <EndPageSettingsInput {...form.endPage} /> : null}
      </Skeleton>
    </>
  )
}
