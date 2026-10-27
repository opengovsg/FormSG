import { afterEach, describe, expect, it, vi } from 'vitest'

import { HttpError } from '~services/ApiService'

import { reactQueryLogger } from '../reactQueryLogger'

const { warnSpy } = vi.hoisted(() => ({ warnSpy: vi.fn() }))

vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: { logger: { warn: warnSpy } },
}))

afterEach(() => {
  vi.restoreAllMocks()
  warnSpy.mockClear()
})

describe('reactQueryLogger', () => {
  describe('error', () => {
    it('should suppress console.error for 4xx HttpErrors and warn-log them instead', () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const error = new HttpError('User not authorized to read form', 403)

      // Act
      reactQueryLogger.error(error)

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith(
        'Expected client error: User not authorized to read form',
        {
          meta: {
            action: 'reactQueryLogger',
            error: { code: 403, message: 'User not authorized to read form' },
          },
        },
      )
    })

    it('should pass 5xx HttpErrors through to console.error', () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const error = new HttpError('Internal server error', 500)

      // Act
      reactQueryLogger.error(error)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(error)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('should pass non-HTTP errors through to console.error', () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const error = new Error('something unexpected broke')

      // Act
      reactQueryLogger.error(error)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(error)
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})
