import { useTranslation } from 'react-i18next'

import { FormActivationSvg } from '~features/admin-form/settings/components/FormActivationSvg'

import { SecretKeyVerification } from '../../components/SecretKeyVerification'
import { EmptyResponses } from '../common/EmptyResponses'

import { useStorageResponsesContext } from './StorageResponsesContext'
import { UnlockedResponses } from './UnlockedResponses'
import { useState } from 'react'
import { useFeatureValue } from '@growthbook/growthbook-react'
import { featureFlags } from '~shared/constants'
import UnlockedResponsesV2 from './UnlockedResponses/UnlockedResponsesV2'

export const StorageResponsesTab = (): JSX.Element => {
  const { t } = useTranslation()
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()

  const isUnlockedResponsesV2FlagOn = useFeatureValue(
    featureFlags.unlockedResponsesV2,
    true,
  )
  const [isUnlockedResponsesV2] = useState(isUnlockedResponsesV2FlagOn)

  if (totalResponsesCount === 0) {
    return <EmptyResponses />
  }


  return secretKey ? (
    isUnlockedResponsesV2 ? <UnlockedResponsesV2 /> : <UnlockedResponses />
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
