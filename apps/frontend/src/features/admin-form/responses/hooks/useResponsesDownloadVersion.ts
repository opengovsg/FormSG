import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { RESPONSES_DOWNLOAD_VERSION_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

import { useUser } from '~features/user/queries'

export type ResponsesDownloadVersion = 'v1' | 'v2'

export const useResponsesDownloadVersion = () => {
  const { user } = useUser()
  return useLocalStorage<ResponsesDownloadVersion>(
    user?._id ? `${RESPONSES_DOWNLOAD_VERSION_KEY_PREFIX}${user._id}` : null,
    'v2',
  )
}

export const useIsOneZipDownload = (): boolean => {
  const isEnabled = useFeatureIsOn(featureFlags.attachmentsMultiUploadAndOneZip)
  const [version] = useResponsesDownloadVersion()
  return isEnabled && version !== 'v1'
}
