import { datadogLogs } from '@datadog/browser-logs'

import {
  isPublicFormPathname,
  registerChunkPreloadErrorListener,
} from './chunkPreloadError'

vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: { logger: { error: vi.fn() } },
}))

const MOCK_FORM_ID = '61540ece3d4a6e50ac0cc6ff'

const mockLoggerError = datadogLogs.logger.error as unknown as ReturnType<
  typeof vi.fn
>

const setPathname = (pathname: string) => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { pathname },
  })
}

/** Dispatches a preload error at the registered handler, returning the event. */
const dispatchPreloadError = () => {
  const event = new Event('vite:preloadError', {
    cancelable: true,
  }) as VitePreloadErrorEvent
  event.payload = new Error(
    'Failed to fetch dynamically imported module: /assets/index-abc.js',
  )
  window.dispatchEvent(event)
  return event
}

describe('chunkPreloadError', () => {
  let unregister: (() => void) | undefined

  /**
   * Registers exactly one handler for the current test. The unregister call in
   * afterEach is load-bearing: listeners are added to the jsdom window shared by
   * every test in this file, so leaking one leaves a handler that logs during
   * later tests.
   */
  const register = () => {
    unregister = registerChunkPreloadErrorListener()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setPathname('/dashboard')
  })

  afterEach(() => {
    unregister?.()
    unregister = undefined
  })

  describe('isPublicFormPathname', () => {
    it('should match a bare public form route', () => {
      expect(isPublicFormPathname(`/${MOCK_FORM_ID}`)).toBe(true)
    })

    it('should match a public form subroute', () => {
      expect(isPublicFormPathname(`/${MOCK_FORM_ID}/payment/abc`)).toBe(true)
    })

    it('should not match admin routes containing a form id', () => {
      expect(isPublicFormPathname(`/admin/form/${MOCK_FORM_ID}`)).toBe(false)
    })

    it('should not match non-form routes', () => {
      expect(isPublicFormPathname('/dashboard')).toBe(false)
      expect(isPublicFormPathname('/')).toBe(false)
    })
  })

  describe('registerChunkPreloadErrorListener', () => {
    it('should log the failure with the pathname and error', () => {
      register()

      dispatchPreloadError()

      expect(mockLoggerError).toHaveBeenCalledTimes(1)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Chunk preload failed',
        expect.objectContaining({
          meta: expect.objectContaining({
            pathname: '/dashboard',
            error: expect.objectContaining({
              message:
                'Failed to fetch dynamically imported module: /assets/index-abc.js',
            }),
          }),
        }),
      )
    })

    // Vite rethrows unless the event is cancelled. Observing must not change
    // what the app does with the failure.
    it('should not suppress the rethrow', () => {
      register()

      const event = dispatchPreloadError()

      expect(event.defaultPrevented).toBe(false)
    })
  })
})
