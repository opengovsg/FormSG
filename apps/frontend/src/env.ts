import type { PackageMode } from '@opengovsg/formsg-sdk'

import type { FrontendRuntimeEnv } from 'formsg-shared/types'

const formsgSdkMode =
  (import.meta.env.VITE_APP_FORMSG_SDK_MODE as PackageMode | undefined) ??
  'production'

export const env: FrontendRuntimeEnv = {
  appUrl: import.meta.env.VITE_APP_URL ?? 'https://form.gov.sg',
  apiBaseUrl: import.meta.env.VITE_APP_BASE_URL ?? '/api/v3',
  gaTrackingId: import.meta.env.VITE_APP_GA_TRACKING_ID ?? '',
  formsgSdkMode,
  ddRumEnv: import.meta.env.VITE_APP_DD_RUM_ENV ?? '',
  ddSampleRate: Number(import.meta.env.VITE_APP_DD_SAMPLE_RATE) || 5,
}
