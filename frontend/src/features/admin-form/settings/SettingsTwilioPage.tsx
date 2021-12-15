import { CategoryHeader } from './components/CategoryHeader'
import { TwilioSettingsSection } from './components/TwilioSettingsSection'

export const SettingsTwilioPage = (): JSX.Element => {
  return (
    <>
      <CategoryHeader>Twilio credentials</CategoryHeader>
      <TwilioSettingsSection />
    </>
  )
}
