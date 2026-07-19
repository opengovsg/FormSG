import { useTranslation } from 'react-i18next'
import { useFeatureValue } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { FormActivationSvg } from '~features/admin-form/settings/components/FormActivationSvg'

import { SecretKeyVerification } from '../../components/SecretKeyVerification'
import { EmptyResponses } from '../common/EmptyResponses'

import { UnlockedResponsesV2 } from './UnlockedResponses/UnlockedResponsesV2'
import { useStorageResponsesContext } from './StorageResponsesContext'
import { UnlockedResponses } from './UnlockedResponses'

export const StorageResponsesTab = (): JSX.Element => {
  const { t } = useTranslation()
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()
  const isDelightfulDashboardEnabled = useFeatureValue(
    featureFlags.delightfulDashboard,
    false,
  )

  if (totalResponsesCount === 0) {
    return <EmptyResponses />
  }

  return secretKey ? (
    isDelightfulDashboardEnabled ? (
      <UnlockedResponsesV2 />
    ) : (
      <UnlockedResponses />
    )
  ) : (
    <SecretKeyVerification
      heroSvg={<FormActivationSvg />}
      ctaText={t(
        'features.adminForm.responses.responsesPage.storage.storageResponsesTab.secretKeyVerification.ctaText',
      )}
      label={t(
        'features.adminForm.responses.responsesPage.storage.storageResponsesTab.secretKeyVerification.label',
      )}
    />
  )
}
