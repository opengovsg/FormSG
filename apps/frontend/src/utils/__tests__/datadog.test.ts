import { afterEach, describe, expect, it, vi } from 'vitest'

const importDatadogUtils = async () => {
  vi.resetModules()
  return await import('../datadog')
}

afterEach(() => {
  vi.restoreAllMocks()
  window.DD_RUM = undefined
})

describe('datadogRum', () => {
  describe('DD_RUM is undefined', () => {
    it('should return a noop function for addAction', async () => {
      // Arrange
      window.DD_RUM = undefined
      const { datadogRum } = await importDatadogUtils()

      // Assert
      expect(window.DD_RUM).not.toBeDefined()
      expect(datadogRum.addAction).not.toThrow()
    })
  })

  describe('DD_RUM is defined', () => {
    it('should call addAction without throwing', async () => {
      // Arrange
      const addActionSpy = vi.fn()
      // @ts-expect-error partial DD_RUM mock
      window.DD_RUM = { addAction: addActionSpy }
      const { datadogRum } = await importDatadogUtils()

      // Assert
      expect(window.DD_RUM).toBeDefined()
      expect(datadogRum.addAction).not.toThrow()
      expect(addActionSpy).toBeCalledTimes(1)
    })
  })
})

describe('sendDdAction', () => {
  it('should log an error and not throw when DD_RUM is undefined', async () => {
    // Arrange
    window.DD_RUM = undefined
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const { sendDdAction } = await importDatadogUtils()
    const fnCall = vi.fn()

    // Act
    await sendDdAction(fnCall)

    // Assert
    expect(fnCall).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Datadog RUM does not exist, unable to send custom action',
    )
  })

  it('should invoke the callback via onReady when DD_RUM is defined', async () => {
    // Arrange
    const onReadySpy = vi.fn((cb: () => void) => cb())
    // @ts-expect-error partial DD_RUM mock
    window.DD_RUM = { onReady: onReadySpy }
    const { sendDdAction } = await importDatadogUtils()
    const fnCall = vi.fn()

    // Act
    await sendDdAction(fnCall)

    // Assert
    expect(onReadySpy).toHaveBeenCalledTimes(1)
    expect(fnCall).toHaveBeenCalledTimes(1)
  })

  it('should log an error and not throw when onReady throws', async () => {
    // Arrange
    // @ts-expect-error partial DD_RUM mock
    window.DD_RUM = {
      onReady: vi.fn(() => {
        throw new Error('boom')
      }),
    }
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const { sendDdAction } = await importDatadogUtils()

    // Act + Assert
    await expect(sendDdAction(vi.fn())).resolves.toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})

describe('sendDdFormCreationSelectionAction', () => {
  it('should send an addAction with response mode and rounded duration', async () => {
    // Arrange
    const addActionSpy = vi.fn()
    // @ts-expect-error partial DD_RUM mock
    window.DD_RUM = {
      onReady: vi.fn((cb: () => void) => cb()),
      addAction: addActionSpy,
    }
    const { sendDdFormCreationSelectionAction } = await importDatadogUtils()

    // Act
    await sendDdFormCreationSelectionAction(
      'encrypt' as Parameters<typeof sendDdFormCreationSelectionAction>[0],
      1234.56,
    )

    // Assert
    expect(addActionSpy).toHaveBeenCalledWith(
      'dashboard.create.selection_screen_completed',
      {
        response_mode: 'encrypt',
        duration_ms: 1235,
      },
    )
  })
})
