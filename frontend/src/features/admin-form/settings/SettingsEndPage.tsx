import { useAdminForm } from '../common/queries'

import { CategoryHeader } from './components/CategoryHeader'
import { EndPageSettingsInput } from './components/EndPageSettingsSection/EndPageSettingsInput'

export const SettingsEndPage = (): JSX.Element => {
  const { data: form } = useAdminForm()

  return (
    <>
      <CategoryHeader mb={0}>Customise Thank You page</CategoryHeader>
      {form && <EndPageSettingsInput endPage={form.endPage} />}
    </>
  )
}
