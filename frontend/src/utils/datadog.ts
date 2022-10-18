import { RumInitConfiguration } from '@datadog/browser-rum'

// Discard benign RUM errors.
export const ddBeforeSend: RumInitConfiguration['beforeSend'] = (
  event,
  context,
) => {
  if (event.type !== 'error') return

  // Discard unauth'd errors
  if (event.error.resource?.status_code === 401) {
    return false
  }
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
}
