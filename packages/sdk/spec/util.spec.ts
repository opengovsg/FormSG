import { areAttachmentFieldIdsValid } from '../src/util/crypto'
describe('utils', () => {
  describe('areAttachmentFieldIdsValid', () => {
    it('should return true when all the fieldIds are within the filenames', () => {
      // Arrange
      const MOCK_FILENAMES = {
        mock: 'file',
        alsomock: 'file2',
      }
      const MOCK_FIELD_IDS = Object.keys(MOCK_FILENAMES)

      // Act
      const actual = areAttachmentFieldIdsValid(MOCK_FIELD_IDS, MOCK_FILENAMES)

      // Assert
      expect(actual).toBe(true)
    })

    it('should return false when some fieldIds are not within the filenames', () => {
      // Arrange
      const MOCK_FILENAMES = {
        mock: 'file',
        alsomock: 'file2',
      }
      const MOCK_FIELD_IDS = Object.keys(MOCK_FILENAMES).concat('missingField')

      // Act
      const actual = areAttachmentFieldIdsValid(MOCK_FIELD_IDS, MOCK_FILENAMES)

      // Assert
      expect(actual).toBe(false)
    })
  })
})
