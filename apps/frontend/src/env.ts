import type { FrontendRuntimeEnv } from 'formsg-shared/types'

declare global {
  interface Window {
    __ENV__?: FrontendRuntimeEnv
  }
}

export const env: FrontendRuntimeEnv = {
  appUrl: window.__ENV__?.appUrl ?? import.meta.env.VITE_APP_URL ?? '',
  apiBaseUrl:
    window.__ENV__?.apiBaseUrl ??
    import.meta.env.VITE_APP_BASE_URL ??
    '/api/v3',
  gaTrackingId:
    window.__ENV__?.gaTrackingId ??
    import.meta.env.VITE_APP_GA_TRACKING_ID ??
    '',
  formsgSdkMode:
    window.__ENV__?.formsgSdkMode ??
    (import.meta.env.VITE_APP_FORMSG_SDK_MODE as
      | FrontendRuntimeEnv['formsgSdkMode']
      | undefined) ??
    'production',
  ddRumEnv:
    window.__ENV__?.ddRumEnv ?? import.meta.env.VITE_APP_DD_RUM_ENV ?? '',
  ddSampleRate:
    window.__ENV__?.ddSampleRate ??
    (Number(import.meta.env.VITE_APP_DD_SAMPLE_RATE) || 5),
}
