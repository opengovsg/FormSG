import { QueryClient } from 'react-query'
import { datadogLogs } from '@datadog/browser-logs'

import {
  isPublicFormPathname,
  registerChunkPreloadErrorHandler,
} from './chunkPreloadError'

vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: { logger: { error: vi.fn() } },
}))

const MOCK_FORM_ID = '61540ece3d4a6e50ac0cc6ff'

const mockLoggerError = datadogLogs.logger.error as unknown as ReturnType<
  typeof vi.fn
>

const mockReload = vi.fn()

const setPathname = (pathname: string) => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { pathname, reload: mockReload },
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
  let queryClient: QueryClient
  let unregister: (() => void) | undefined

  /**
   * Registers exactly one handler for the current test. The unregister call in
   * afterEach is load-bearing: listeners are added to the jsdom window shared by
   * every test in this file, so leaking one leaves a handler holding a stale
   * queryClient that reloads in later tests.
   */
  const register = () => {
    unregister = registerChunkPreloadErrorHandler(queryClient)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.sessionStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-13T00:00:00Z'))
    setPathname('/dashboard')
    queryClient = new QueryClient()
  })

  afterEach(() => {
    unregister?.()
    unregister = undefined
    vi.useRealTimers()
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

  describe('registerChunkPreloadErrorHandler', () => {
    it('should reload and suppress the rethrow on first failure', () => {
      register()

      const event = dispatchPreloadError()

      expect(mockReload).toHaveBeenCalledTimes(1)
      expect(event.defaultPrevented).toBe(true)
    })

    it('should not reload again within the repeat window', () => {
      register()

      dispatchPreloadError()
      expect(mockReload).toHaveBeenCalledTimes(1)

      // The guard is the sessionStorage marker, which survives the reload, so
      // dispatching again exercises the same path a fresh page load would.
      vi.advanceTimersByTime(5_000)
      const event = dispatchPreloadError()

      expect(mockReload).toHaveBeenCalledTimes(1)
      expect(event.defaultPrevented).toBe(false)
      expect(mockLoggerError).toHaveBeenLastCalledWith(
        'Chunk preload failed',
        expect.objectContaining({
          meta: expect.objectContaining({ isRepeat: true, willReload: false }),
        }),
      )
    })

    it('should reload again once the repeat window has passed', () => {
      register()

      dispatchPreloadError()
      vi.advanceTimersByTime(30_000)
      dispatchPreloadError()

      expect(mockReload).toHaveBeenCalledTimes(2)
    })

    it('should not reload while a mutation is in flight', () => {
      vi.spyOn(queryClient, 'isMutating').mockReturnValue(1)
      register()

      const event = dispatchPreloadError()

      expect(mockReload).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
      expect(mockLoggerError).toHaveBeenLastCalledWith(
        'Chunk preload failed',
        expect.objectContaining({
          meta: expect.objectContaining({
            hasInFlightMutation: true,
            willReload: false,
          }),
        }),
      )
    })

    it('should not reload on a public form route', () => {
      setPathname(`/${MOCK_FORM_ID}`)
      register()

      const event = dispatchPreloadError()

      expect(mockReload).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
      expect(mockLoggerError).toHaveBeenLastCalledWith(
        'Chunk preload failed',
        expect.objectContaining({
          meta: expect.objectContaining({
            mayHaveUnsavedInput: true,
            willReload: false,
          }),
        }),
      )
    })

    it('should stop handling once unregistered', () => {
      register()
      unregister?.()
      unregister = undefined

      const event = dispatchPreloadError()

      expect(mockReload).not.toHaveBeenCalled()
      expect(mockLoggerError).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
    })

    it('should log the failure even when it does not reload', () => {
      setPathname(`/${MOCK_FORM_ID}`)
      register()

      dispatchPreloadError()

      expect(mockLoggerError).toHaveBeenCalledTimes(1)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Chunk preload failed',
        expect.objectContaining({
          meta: expect.objectContaining({
            error: expect.objectContaining({
              message:
                'Failed to fetch dynamically imported module: /assets/index-abc.js',
            }),
          }),
        }),
      )
    })
  })
})
