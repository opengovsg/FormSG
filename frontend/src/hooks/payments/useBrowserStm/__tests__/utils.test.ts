import { addEntry, getEntry, processEviction } from '../utils'

const EMPTY_OBJ = {}
describe('useBrowserStm', () => {
  describe('processEviction', () => {
    afterEach(() => {
      jest.useRealTimers()
    })
    it('should only be called once if called in quick succession', () => {
      // Arrange

      // Act
      const result1 = processEviction(EMPTY_OBJ)
      const result2 = processEviction(EMPTY_OBJ)

      // Assert
      expect(result1).toEqual(result2)
    })

    it('should evict entries that are old', () => {
      // Arrange
      const tempId = 'form1'
      const mockDate = new Date('2020-12-21')

      jest.useFakeTimers('modern').setSystemTime(mockDate)
      const entryObj = addEntry(EMPTY_OBJ, {
        formId: tempId,
        paymentId: 'payment1',
      })
      jest.useRealTimers()

      // Act
      processEviction(entryObj)

      // Assert
      expect(getEntry(entryObj, tempId)).toBeFalsy()
    })
  })
})
