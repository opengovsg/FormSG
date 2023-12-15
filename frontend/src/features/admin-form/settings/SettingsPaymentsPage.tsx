import { FormResponseMode } from '~shared/types'

import { CategoryHeader } from './components/CategoryHeader'
import { PaymentSettingsSection } from './components/PaymentSettingsSection'
import { PaymentsUnsupportedMsg } from './components/PaymentSettingsSection/PaymentsUnsupportedMsg'
import { useAdminFormSettings } from './queries'

export const SettingsPaymentsPage = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  // Payments are only supported in storage mode; show message if form response mode is enything else.
  if (!isLoading && settings?.responseMode !== FormResponseMode.Encrypt) {
    return <PaymentsUnsupportedMsg />
  }

  return (
    <>
      <CategoryHeader>Payments</CategoryHeader>
      <PaymentSettingsSection />
    </>
  )
}
