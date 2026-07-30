import { useTranslation } from 'react-i18next'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types'

import { CategoryHeader } from './components/CategoryHeader'
import { PaymentSettingsSection } from './components/PaymentSettingsSection'
import { PaymentsUnsupportedMsg } from './components/PaymentSettingsSection/PaymentsUnsupportedMsg'
import { useAdminFormSettings } from './queries'

export const SettingsPaymentsPage = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useAdminFormSettings()
  const isMrfPaymentsEnabled = useFeatureIsOn(featureFlags.mrfPayments)

  // Payments are supported on storage mode forms, and on multirespondent
  // forms behind a feature flag; show message for anything else.
  const isPaymentCapableMode =
    settings?.responseMode === FormResponseMode.Encrypt ||
    (settings?.responseMode === FormResponseMode.Multirespondent &&
      isMrfPaymentsEnabled)
  if (!isLoading && !isPaymentCapableMode) {
    return <PaymentsUnsupportedMsg />
  }

  return (
    <>
      <CategoryHeader>
        {t('features.adminForm.settings.payments.title')}
      </CategoryHeader>
      <PaymentSettingsSection />
    </>
  )
}
