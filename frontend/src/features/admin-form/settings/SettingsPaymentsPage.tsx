import { FormResponseMode } from '~shared/types'

import { CategoryHeader } from './components/CategoryHeader'
import { PaymentSettingsSection } from './components/PaymentSettingsSection'
import { PaymentsUnsupportedMsg } from './components/PaymentSettingsSection/PaymentsUnsupportedMsg'
import { useAdminFormSettings } from './queries'

export const SettingsPaymentsPage = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  // Payments are unsupported in email mode; show message.
  if (!isLoading && settings?.responseMode !== FormResponseMode.Encrypt) {
    return <PaymentsUnsupportedMsg responseMode={settings?.responseMode} />
  }

  return (
    <>
      <CategoryHeader>Payments</CategoryHeader>
      <PaymentSettingsSection />
    </>
  )
}
