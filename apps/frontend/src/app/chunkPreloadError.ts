import { datadogLogs } from '@datadog/browser-logs'

/**
 * Public form respondent routes, i.e. `/:formId` where formId is a 24-char hex
 * ObjectId, optionally with a subroute. Mirrors the backend's
 * `/:formId([a-fA-F0-9]{24})` in frontend.routes.ts. Logged because a
 * respondent-facing failure is more severe than an admin one, and because any
 * future recovery must treat the two differently.
 */
const PUBLIC_FORM_PATHNAME_REGEX = /^\/[a-fA-F0-9]{24}(\/|$)/

export const isPublicFormPathname = (pathname: string): boolean =>
  PUBLIC_FORM_PATHNAME_REGEX.test(pathname)

/**
 * Registers the `vite:preloadError` reporter.
 *
 * @returns a function that unregisters the handler. Unused in the app, where
 * the handler lives for the lifetime of the page; tests need it so listeners do
 * not accumulate on the shared jsdom window.
 */
export const registerChunkPreloadErrorListener = (): (() => void) => {
  const handlePreloadError = (event: VitePreloadErrorEvent) => {
    datadogLogs.logger.error('Chunk preload failed', {
      meta: {
        action: 'handlePreloadError',
        pathname: window.location.pathname,
        version: import.meta.env.VITE_APP_VERSION,
        isPublicForm: isPublicFormPathname(window.location.pathname),
        error: {
          message: event.payload?.message,
          stack: event.payload?.stack,
        },
      },
    })
  }

  window.addEventListener('vite:preloadError', handlePreloadError)

  return () =>
    window.removeEventListener('vite:preloadError', handlePreloadError)
}
