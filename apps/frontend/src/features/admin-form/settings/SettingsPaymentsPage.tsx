import { useTranslation } from 'react-i18next'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, PaymentChannel } from 'formsg-shared/types'

import { CategoryHeader } from './components/CategoryHeader'
import { PaymentSettingsSection } from './components/PaymentSettingsSection'
import { PaymentsUnsupportedMsg } from './components/PaymentSettingsSection/PaymentsUnsupportedMsg'
import { useAdminFormSettings } from './queries'

export const SettingsPaymentsPage = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useAdminFormSettings()
  const isMrfPaymentsEnabled = useFeatureIsOn(featureFlags.mrfPayments)

  // Payments are supported on storage mode forms, and on multirespondent
  // forms behind a feature flag; show message for anything else. An MRF with
  // payments enabled or Stripe connected stays visible even with the flag
  // off, so admins keep access to the disable/unlink escape hatches — the
  // flag kills enablement, not administration of a live payment form.
  const isPaymentCapableMode =
    settings?.responseMode === FormResponseMode.Encrypt ||
    (settings?.responseMode === FormResponseMode.Multirespondent &&
      (isMrfPaymentsEnabled ||
        settings.payments_field.enabled ||
        settings.payments_channel.channel !== PaymentChannel.Unconnected))
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
