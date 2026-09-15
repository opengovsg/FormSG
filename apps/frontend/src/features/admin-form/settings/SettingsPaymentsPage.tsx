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
