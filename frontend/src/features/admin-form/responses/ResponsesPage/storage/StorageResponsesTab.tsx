import { useTranslation } from 'react-i18next'

import { FormActivationSvg } from '~features/admin-form/settings/components/FormActivationSvg'

import { SecretKeyVerification } from '../../components/SecretKeyVerification'
import { EmptyResponses } from '../common/EmptyResponses'

import { useStorageResponsesContext } from './StorageResponsesContext'
import { UnlockedResponses } from './UnlockedResponses'

export const StorageResponsesTab = (): JSX.Element => {
  const { t } = useTranslation()
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()

  if (totalResponsesCount === 0) {
    return <EmptyResponses />
  }

  return secretKey ? (
    <UnlockedResponses />
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
