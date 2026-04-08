import { datadogRum, RumInitConfiguration } from '@datadog/browser-rum'

import { env } from './src/env'

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
  applicationId: import.meta.env.VITE_APP_DD_RUM_APP_ID ?? '',
  clientToken: import.meta.env.VITE_APP_DD_RUM_CLIENT_TOKEN ?? '',
  env: env?.ddRumEnv ?? '',
  site: 'datadoghq.com',
  service: 'formsg-react',
  allowedTracingUrls: [env?.appUrl ?? ''],
  version: import.meta.env.VITE_APP_VERSION ?? '',
  sessionSampleRate: env?.ddSampleRate ?? 5,
  sessionReplaySampleRate: 100,
  trackUserInteractions: true,
  defaultPrivacyLevel: 'mask-user-input',
  beforeSend: ddBeforeSend,
})

datadogRum.startSessionReplayRecording()
