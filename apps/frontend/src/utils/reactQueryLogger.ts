import { setLogger } from 'react-query'
import { datadogLogs } from '@datadog/browser-logs'

import { HttpError } from '~services/ApiService'

type ReactQueryLogger = Parameters<typeof setLogger>[0]

const isExpectedClientError = (error: unknown): error is HttpError =>
  error instanceof HttpError && error.code >= 400 && error.code < 500

/**
 * react-query v3 reports every failed query/mutation through its logger's
 * `error` channel, and the default logger is `console` (this logging was
 * removed upstream in react-query v4). Datadog RUM captures `console.error`
 * as a client-side error, so expected 4xx API responses — e.g. a
 * non-collaborator opening an admin preview, or a closed form's inactive
 * message — each mint a new Error Tracking issue and trip the
 * "new client-side error" monitor.
 *
 * These 4xx responses are already handled by the UI, so keep them out of
 * `console.error` and record them as structured warn logs instead: they stay
 * queryable in Datadog logs without raising RUM errors. Everything else
 * (5xx, non-HTTP errors) still goes to `console.error` and surfaces in RUM.
 */
export const reactQueryLogger: ReactQueryLogger = {
  log: console.log,
  warn: console.warn,
  error: (error: unknown) => {
    if (isExpectedClientError(error)) {
      datadogLogs.logger.warn(`Expected client error: ${error.message}`, {
        meta: {
          action: 'reactQueryLogger',
          error: { code: error.code, message: error.message },
        },
      })
      return
    }
    console.error(error)
  },
}
