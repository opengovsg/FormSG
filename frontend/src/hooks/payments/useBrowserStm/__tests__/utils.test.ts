import { addEntry, BrowserStmDto, getEntry, processEviction } from '../utils'

const EMPTY_OBJ = {}
describe('useBrowserStm', () => {
  describe('processEviction', () => {
    afterEach(() => {
      vi.useRealTimers()
    })
    beforeEach(() => {
      processEviction.cancel()
    })
    it('should only be called once if called in quick succession', () => {
      // Arrange
      const mockFn = vi.fn()

      // Act, Assert
      processEviction(EMPTY_OBJ, mockFn)
      expect(mockFn).toBeCalledTimes(1)
      processEviction(EMPTY_OBJ, mockFn)
      expect(mockFn).toBeCalledTimes(1)
    })

    it('should evict entries that are old', () =>
      new Promise<void>((resolve) => {
        // Arrange
        const tempId = 'form1'
        const mockDate = new Date('2020-12-21')

        vi.useFakeTimers().setSystemTime(mockDate)
        const entryObj = addEntry(EMPTY_OBJ, {
          formId: tempId,
          paymentId: 'payment1',
        })
        vi.useRealTimers()
        const mockFn = (retObject: BrowserStmDto) => {
          // Assert
          expect(getEntry(retObject, tempId)).toBeFalsy()
          resolve()
        }

        // Act
        processEviction(entryObj, mockFn)
      }))
  })
})
