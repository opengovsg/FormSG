import { CategoryHeader } from './components/CategoryHeader'
import { PaymentSettingsSection } from './components/PaymentSettingsSection'

export const SettingsPaymentsPage = (): JSX.Element => {
  return (
    <>
      <CategoryHeader>Payments</CategoryHeader>
      <PaymentSettingsSection />
    </>
  )
}
