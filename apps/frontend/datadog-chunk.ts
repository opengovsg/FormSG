/**
 * This file compiles to datadog-chunk.js which is then loaded in the <head> of the react app
 * This ensures that datadog is initialised before the react app
 *
 * Build-time vars (import.meta.env): VITE_APP_DD_RUM_APP_ID, VITE_APP_DD_RUM_CLIENT_TOKEN, VITE_APP_VERSION
 * Runtime vars (window.__ENV__): ddRumEnv, appUrl, ddSampleRate
 */

import { datadogRum, RumInitConfiguration } from '@datadog/browser-rum'

import type { FrontendRuntimeEnv } from 'formsg-shared/types'

declare global {
  interface Window {
    __ENV__?: FrontendRuntimeEnv
  }
}

// Discard benign RUM errors.
// Ensure that beforeSend returns true to keep the event and false to discard it.
const ddBeforeSend: RumInitConfiguration['beforeSend'] = (event) => {
  if (event.type !== 'error') return true

  // Caused by @chakra-ui/react@latest-v1 -> @chakra-ui/modal@1.11.1 -> react-remove-scroll@2.4.1
  // Already fixed in @chakra-ui/react@latest, but we cannot upgrade until we upgrade to React 18.
  // See https://github.com/theKashey/react-remove-scroll/issues/8.
  // TODO(#4889): Remove this when we update to React 18.
  if (event.error.type === 'IgnoredEventCancel') {
    return false
  }

  // Discard benign ResizeObserver loop limit exceeded errors
  if (event.error.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }

  return true
}

// Init Datadog RUM
datadogRum.init({
  applicationId: '@VITE_APP_DD_RUM_APP_ID',
  clientToken: '@VITE_APP_DD_RUM_CLIENT_TOKEN',
  env: window.__ENV__?.ddRumEnv ?? '',
  site: 'datadoghq.com',
  service: 'formsg-react',
  allowedTracingUrls: [window.__ENV__?.appUrl ?? window.location.origin],
  version: '@VITE_APP_VERSION',
  sessionSampleRate: window.__ENV__?.ddSampleRate ?? 5,
  sessionReplaySampleRate: 100,
  trackUserInteractions: true,
  defaultPrivacyLevel: 'mask-user-input',
  beforeSend: ddBeforeSend,
})

datadogRum.startSessionReplayRecording()
