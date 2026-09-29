import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { FormAuthType } from 'formsg-shared/types'
import { ResolvedStepAuth } from 'formsg-shared/utils/workflow-auth'

import { SettingsStepLoginStrings } from '~/i18n/locales/features/admin-form/settings'

export const STEP_LOGIN_COPY_KEY = 'features.adminForm.settings.stepLogin'

const TYPE_KEYS: Record<FormAuthType, keyof SettingsStepLoginStrings['types']> =
  {
    [FormAuthType.NIL]: 'nil',
    [FormAuthType.MyInfo]: 'myInfo',
    [FormAuthType.CP]: 'cp',
    [FormAuthType.SP]: 'sp',
    [FormAuthType.SGID]: 'sgid',
    [FormAuthType.SGID_MyInfo]: 'sgidMyInfo',
  }

// Labels for a step's login: its provider, then each check it runs.
export const useStepLoginLabels = () => {
  const { t } = useTranslation()

  const getTypeLabel = useCallback(
    (authType: FormAuthType): string =>
      t(`${STEP_LOGIN_COPY_KEY}.types.${TYPE_KEYS[authType]}`),
    [t],
  )

  const getCheckLabels = useCallback(
    (resolved: ResolvedStepAuth): string[] => {
      const isCorppass = resolved.authType === FormAuthType.CP
      const badgeKey = `${STEP_LOGIN_COPY_KEY}.badges`
      return [
        resolved.isSubmitterIdCollectionEnabled
          ? t(`${badgeKey}.${isCorppass ? 'collectsUen' : 'collectsNric'}`)
          : null,
        resolved.isWhitelistEnabled
          ? t(
              `${badgeKey}.${isCorppass ? 'onlyListedUens' : 'onlyListedNrics'}`,
            )
          : null,
        resolved.isSingleSubmission ? t(`${badgeKey}.oneResponseEach`) : null,
      ].filter((label): label is string => label !== null)
    },
    [t],
  )

  return { getTypeLabel, getCheckLabels }
}
