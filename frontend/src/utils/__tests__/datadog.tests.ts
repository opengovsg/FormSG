/* eslint-disable @typescript-eslint/no-require-imports */
describe('datadogRum', () => {
  describe('DD_RUM is undefined', () => {
    beforeEach(() => {
      window.DD_RUM = undefined
    })

    afterEach(() => {
      jest.resetModules()
    })

    it('should return a noop function for addAction', () => {
      // Arrange

      const datadogRum = require('../datadog').datadogRum
      // Assert
      expect(window.DD_RUM).not.toBeDefined()
      expect(datadogRum.addAction).not.toThrow()
    })
  })

  describe('DD_RUM is defined', () => {
    let addActionSpy: jest.Mock
    beforeEach(() => {
      addActionSpy = jest.fn()
      // @ts-expect-error mocking undefined DD_RUM
      window.DD_RUM = {
        addAction: addActionSpy,
      }
    })

    afterEach(() => {
      jest.resetModules()
    })

    it('should call addAction without throwing', () => {
      // Arrange
      const datadogRum = require('../datadog').datadogRum

      // Assert
      expect(window.DD_RUM).toBeDefined()
      expect(datadogRum.addAction).not.toThrow()
      expect(addActionSpy).toBeCalledTimes(1)
    })
  })
})

export {}
