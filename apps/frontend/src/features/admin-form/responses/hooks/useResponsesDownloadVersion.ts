import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { RESPONSES_DOWNLOAD_VERSION_KEY } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

/** v1 saves a zip per response, v2 saves everything in one zip. */
export type ResponsesDownloadVersion = 'v1' | 'v2'

export const useResponsesDownloadVersion = () =>
  useLocalStorage<ResponsesDownloadVersion>(
    RESPONSES_DOWNLOAD_VERSION_KEY,
    'v2',
  )

/**
 * Whether a download goes into one zip: Attachments v2 is on and the admin
 * hasn't switched back to v1.
 */
export const useIsOneZipDownload = (): boolean => {
  const isEnabled = useFeatureIsOn(featureFlags.attachmentsV2)
  const [version] = useResponsesDownloadVersion()
  return isEnabled && version !== 'v1'
}
