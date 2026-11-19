import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { RESPONSES_DOWNLOAD_VERSION_KEY } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

export type ResponsesDownloadVersion = 'v1' | 'v2'

export const useResponsesDownloadVersion = () =>
  useLocalStorage<ResponsesDownloadVersion>(
    RESPONSES_DOWNLOAD_VERSION_KEY,
    'v2',
  )

export const useIsOneZipDownload = (): boolean => {
  const isEnabled = useFeatureIsOn(featureFlags.attachmentsV2)
  const [version] = useResponsesDownloadVersion()
  return isEnabled && version !== 'v1'
}
