import { Skeleton } from '@chakra-ui/react'

import { CategoryHeader } from './components/CategoryHeader'
import { EndPageSettingsInput } from './components/EndPageSettingsSection/EndPageSettingsInput'
import { useAdminFormSettings } from './queries'

export const SettingsEndPage = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  return (
    <>
      <CategoryHeader mb={0}>Customise Thank You page</CategoryHeader>
      <Skeleton isLoaded={!isLoading && !!settings}>
        {settings ? <EndPageSettingsInput settings={settings.endPage} /> : null}
      </Skeleton>
    </>
  )
}
