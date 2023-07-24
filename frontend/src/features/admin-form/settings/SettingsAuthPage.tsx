import AuthSettingsSection from './components/AuthSettingsSection'
import { CategoryHeader } from './components/CategoryHeader'

export const SettingsAuthPage = (): JSX.Element => {
  return (
    <>
      <CategoryHeader>Singpass authentication</CategoryHeader>
      <AuthSettingsSection />
    </>
  )
}
