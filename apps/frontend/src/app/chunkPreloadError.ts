import { QueryClient } from 'react-query'
import { datadogLogs } from '@datadog/browser-logs'

/**
 * Recovers from failed lazy-route chunk loads by reloading once.
 *
 * Vite fires `vite:preloadError` when a dynamic `import()` cannot be fetched.
 * The two causes we see in production are:
 *
 * 1. A tab left open across a deploy requests a hash that is no longer on the
 *    container's disk. `catchNonExistentStaticRoutesMiddleware` already covers
 *    this by falling back to the S3 static assets bucket.
 * 2. Cloudflare issues a `cf-mitigated` challenge for the chunk request itself.
 *    The interstitial comes back as HTML, so the browser rejects the module and
 *    the app whites out. We handle challenges for API calls in the ApiService
 *    interceptor, but a `<script>` or dynamic `import()` is a plain browser
 *    fetch that axios never sees — so nothing catches this today. A reload
 *    carries the challenge clearance and generally recovers.
 *
 * Reloading is the only client-side recovery available for (2), but it is
 * destructive: it cancels in-flight requests and discards unsaved form state.
 * The guards below keep it to cases where there is nothing to lose.
 */

const RELOAD_MARKER_KEY = 'chunkPreloadErrorReloadedAt'

/** A reload inside this window means the reload did not fix it — stop trying. */
const REPEAT_WINDOW_MS = 10_000

/**
 * Public form respondent routes, i.e. `/:formId` where formId is a 24-char hex
 * ObjectId, optionally with a subroute. Mirrors the backend's
 * `/:formId([a-fA-F0-9]{24})` in frontend.routes.ts.
 */
const PUBLIC_FORM_PATHNAME_REGEX = /^\/[a-fA-F0-9]{24}(\/|$)/

export const isPublicFormPathname = (pathname: string): boolean =>
  PUBLIC_FORM_PATHNAME_REGEX.test(pathname)

/**
 * Registers the `vite:preloadError` recovery handler.
 *
 * @param queryClient used to detect in-flight mutations, which must never be
 * reloaded over — the server may already have persisted the write.
 * @returns a function that unregisters the handler. Unused in the app, where
 * the handler lives for the lifetime of the page; tests need it so listeners do
 * not accumulate on the shared jsdom window.
 */
export const registerChunkPreloadErrorHandler = (
  queryClient: QueryClient,
): (() => void) => {
  const handlePreloadError = (event: VitePreloadErrorEvent) => {
    const lastReloadedAt = Number(
      window.sessionStorage.getItem(RELOAD_MARKER_KEY) ?? 0,
    )
    const isRepeat = Date.now() - lastReloadedAt < REPEAT_WINDOW_MS

    // A pending mutation may already have reached the server. Reloading would
    // cancel the response client-side only, leaving the respondent without a
    // confirmation for a submission that did in fact succeed — and liable to
    // resubmit, or to be locked out by single-submission validation.
    const hasInFlightMutation = queryClient.isMutating() > 0

    // Defensive: no chunk on the public form is lazy today, so this cannot
    // currently fire there. Guarding anyway so that lazily loading a field
    // component later does not silently start discarding half-filled forms.
    const mayHaveUnsavedInput = isPublicFormPathname(window.location.pathname)

    const willReload = !isRepeat && !hasInFlightMutation && !mayHaveUnsavedInput

    datadogLogs.logger.error('Chunk preload failed', {
      meta: {
        action: 'registerChunkPreloadErrorHandler',
        pathname: window.location.pathname,
        version: import.meta.env.VITE_APP_VERSION,
        // `isRepeat` distinguishes the causes above: a stale chunk recovers on
        // the first reload, so repeats point at a challenge or a genuinely
        // absent asset. Correlate with the backend's "Static asset not found in
        // S3" log to separate those two.
        isRepeat,
        hasInFlightMutation,
        mayHaveUnsavedInput,
        willReload,
        error: {
          message: event.payload?.message,
          stack: event.payload?.stack,
        },
      },
    })

    if (!willReload) return

    // Suppress Vite's rethrow — the reload supersedes it.
    event.preventDefault()
    window.sessionStorage.setItem(RELOAD_MARKER_KEY, String(Date.now()))
    window.location.reload()
  }

  window.addEventListener('vite:preloadError', handlePreloadError)

  return () =>
    window.removeEventListener('vite:preloadError', handlePreloadError)
}
