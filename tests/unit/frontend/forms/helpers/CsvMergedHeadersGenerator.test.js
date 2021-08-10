import { stringify } from 'csv-string'
import moment from 'moment-timezone'
import { getResponseInstance } from '../../../../../src/public/modules/forms/helpers/response-factory'
import { CsvMergedHeadersGenerator } from '../../../../../src/public/modules/forms/helpers/CsvMergedHeadersGenerator'

const UTF8_BYTE_ORDER_MARK = '\uFEFF'
const BOM_LENGTH = 1

/**
 * Generates a mock decrypted row object.
 * @param {string | number} append the text to append to the back of all keys.
 * @param {string[]=} answerArray If given, the answer key will be changed to answerArray and this will be assigned to that key.
 * @param {string} [fieldType] Used as fieldType of record if given.
 */
const generateRecord = (append, answerArray, fieldType) => {
  const generated = {
    _id: `mock${append}`,
    question: `mockQuestion${append}`,
    answer: `mockAnswer${append}`,
    fieldType: fieldType || `mockFieldType${append}`,
  }

  if (answerArray) {
    delete generated.answer
    generated.answerArray = answerArray
  }

  return generated
}
const generateHeaderRow = (append) => {
  return {
    _id: `mock${append}`,
    question: `mockQuestion${append}`,
    fieldType: `mockFieldType${append}`,
    isHeader: true,
    answer: '',
  }
}

const generateEmptyRecord = (append) => {
  return {
    _id: `mock${append}`,
    question: `mockQuestion${append}`,
    fieldType: `mockFieldType${append}`,
  }
}

const expectedErrorMessage = 'Response did not match any known type'

/**
 * Reshapes a mock record to match the expected shape in generator.unprocessed.
 * @param {Object} mockRecord
 * @param {Array} mockRecord.record Records each returned by generateRecord
 * @param {string} mockRecord.created Date string
 * @param {string} submissionId
 */
const generateExpectedUnprocessed = (mockRecord) => {
  const reshapedRecord = {}
  mockRecord.record.forEach((fieldRecord) => {
    reshapedRecord[fieldRecord._id] = getResponseInstance(fieldRecord)
  })
  return {
    created: mockRecord.created,
    submissionId: mockRecord.submissionId,
    record: reshapedRecord,
  }
}

describe('CsvMergedHeadersGenerator', () => {
  // Mocked constants
  const mockExpectedNumberOfRecords = 1
  const mockNumOfMetaDataRows = 0
  // Mock created dates
  const mockCreatedEarly = '2019-11-05T13:12:14'
  const mockCreatedLater = '2019-12-05T13:12:14'

  /** @type {CsvMergedHeadersGenerator} */
  let generator

  beforeEach(() => {
    generator = new CsvMergedHeadersGenerator(
      mockExpectedNumberOfRecords,
      mockNumOfMetaDataRows,
    )
  })

  describe('addRecord()', () => {
    it('should handle adding of single non-header answer record', () => {
      // Arrange
      const mockDecryptedRecord = [generateRecord(1)]
      const mockRecord = {
        record: mockDecryptedRecord,
        created: mockCreatedEarly,
        submissionId: 'mockSubmissionId',
      }
      expect(generator.unprocessed.length).toEqual(0)

      // Act
      generator.addRecord(mockRecord)

      // Assert
      // Generate new shape in unprocessed array
      const expectedUnprocessed = [generateExpectedUnprocessed(mockRecord)]

      expect(generator.unprocessed.length).toEqual(1)
      // Check shape
      expect(generator.unprocessed).toEqual(expectedUnprocessed)
      // Check headers
      expect([...generator.fieldIdToQuestion.values()]).toEqual([
        {
          created: mockCreatedEarly,
          question: mockDecryptedRecord[0].question,
        },
      ])
    })

    it('should handle adding of single non-header answerArray (checkbox) record', () => {
      // Arrange
      const mockDecryptedRecord = [
        generateRecord(1, ['1', '2', '3'], 'checkbox'),
      ]
      const mockRecord = {
        record: mockDecryptedRecord,
        created: mockCreatedEarly,
        submissionId: 'mockSubmissionId',
      }
      expect(generator.unprocessed.length).toEqual(0)

      // Act
      generator.addRecord(mockRecord)

      // Assert
      // Generate new shape in unprocessed array
      const expectedUnprocessed = [generateExpectedUnprocessed(mockRecord)]

      expect(generator.unprocessed.length).toEqual(1)
      // Check shape
      expect(generator.unprocessed).toEqual(expectedUnprocessed)
      // Check headers
      expect([...generator.fieldIdToQuestion.values()]).toEqual([
        {
          created: mockCreatedEarly,
          question: mockDecryptedRecord[0].question,
        },
      ])
    })

    it('should handle adding of single non-header answerArray (table) record', () => {
      // Arrange
      const mockDecryptedRecord = [
        generateRecord(
          1,
          [
            ['1', '2', '3'],
            ['4', '5', '6'],
          ],
          'table',
        ),
      ]
      const mockRecord = {
        record: mockDecryptedRecord,
        created: mockCreatedEarly,
        submissionId: 'mockSubmissionId',
      }
      expect(generator.unprocessed.length).toEqual(0)

      // Act
      generator.addRecord(mockRecord)

      // Assert
      // Generate new shape in unprocessed array
      const expectedUnprocessed = [generateExpectedUnprocessed(mockRecord)]

      expect(generator.unprocessed.length).toEqual(1)
      // Check shape
      expect(generator.unprocessed).toEqual(expectedUnprocessed)
      // Check headers
      expect([...generator.fieldIdToQuestion.values()]).toEqual([
        {
          created: mockCreatedEarly,
          question: mockDecryptedRecord[0].question,
        },
      ])
      expect(Object.values(generator.fieldIdToNumCols)).toEqual([2])
    })

    it('should handle adding of single header record', () => {
      // Arrange
      const mockDecryptedRecord = [generateHeaderRow(1)]
      const mockRecord = {
        record: mockDecryptedRecord,
        created: mockCreatedEarly,
        submissionId: 'mockSubmissionId',
      }
      expect(generator.unprocessed.length).toEqual(0)

      // Act
      generator.addRecord(mockRecord)

      // Assert
      // Generate new shape in unprocessed array
      const expectedUnprocessed = [generateExpectedUnprocessed(mockRecord)]

      expect(generator.unprocessed.length).toEqual(1)
      // Check shape
      expect(generator.unprocessed).toEqual(expectedUnprocessed)
      // Check headers
      expect(generator.fieldIdToQuestion.size).toEqual(0)
    })

    it('should override the question to the latest question', () => {
      // Arrange
      const expectedQuestionHeader = 'this should override the old question'
      const mockDecryptedRecordEarlier = [generateRecord(1), generateRecord(2)]

      // Later record has `mock1` id, same as earlier record.
      const mockDecryptedRecordLater = [
        {
          _id: 'mock1',
          question: expectedQuestionHeader,
          answer: 'mockAnswer1',
          fieldType: 'mockFieldType1',
        },
      ]
      const mockRecordEarlier = {
        record: mockDecryptedRecordEarlier,
        created: mockCreatedEarly,
        submissionId: 'mockSubmissionId',
      }
      const mockRecordLater = {
        record: mockDecryptedRecordLater,
        created: mockCreatedLater,
        submissionId: 'mockSubmissionId',
      }
      expect(generator.unprocessed.length).toEqual(0)

      // Act
      // Add record, order should not matter
      generator.addRecord(mockRecordLater)
      generator.addRecord(mockRecordEarlier)

      // Assert
      expect(generator.unprocessed.length).toEqual(2)
      // Should also have 2 headers since `mockDecryptedRecordEarlier` had 2
      // answers.
      expect(generator.fieldIdToQuestion.size).toEqual(2)

      expect(generator.fieldIdToQuestion.get('mock1').question).toEqual(
        expectedQuestionHeader,
      )
    })

    it('should reject response without answer and answerArray', () => {
      // Arrange
      const mockDecryptedRecord = [generateEmptyRecord(1)]
      const mockRecord = {
        record: mockDecryptedRecord,
        created: mockCreatedEarly,
        submissionId: 'mockSubmissionId',
      }
      expect(generator.unprocessed.length).toEqual(0)

      // Act
      const addRecord = () => generator.addRecord(mockRecord)

      // Assert
      // Check error
      expect(addRecord).toThrow(Error)
      expect(addRecord).toThrow(expectedErrorMessage)
      // Record should not be added
      expect(generator.unprocessed.length).toEqual(0)
      // Check headers
      expect(generator.fieldIdToQuestion.size).toEqual(0)
    })

    it('should reject response with non-string answer', () => {
      // Arrange
      const invalidResponse = generateEmptyRecord(1)
      invalidResponse.answer = 1
      const mockDecryptedRecord = [invalidResponse]
      const mockRecord = {
        record: mockDecryptedRecord,
        created: mockCreatedEarly,
        submissionId: 'mockSubmissionId',
      }
      expect(generator.unprocessed.length).toEqual(0)

      // Act
      const addRecord = () => generator.addRecord(mockRecord)

      // Assert
      // Check error
      expect(addRecord).toThrow(Error)
      expect(addRecord).toThrow(expectedErrorMessage)
      // Record should not be added
      expect(generator.unprocessed.length).toEqual(0)
      // Check headers
      expect(generator.fieldIdToQuestion.size).toEqual(0)
    })

    it('should reject response with non-string answerArray', () => {
      // Arrange
      const invalidResponse = generateEmptyRecord(1)
      invalidResponse.answerArray = [1, 2, 3]
      const mockDecryptedRecord = [invalidResponse]
      const mockRecord = {
        record: mockDecryptedRecord,
        created: mockCreatedEarly,
        submissionId: 'mockSubmissionId',
      }
      expect(generator.unprocessed.length).toEqual(0)

      // Act
      const addRecord = () => generator.addRecord(mockRecord)

      // Assert
      // Check error
      expect(addRecord).toThrow(Error)
      expect(addRecord).toThrow(expectedErrorMessage)
      // Record should not be added
      expect(generator.unprocessed.length).toEqual(0)
      // Check headers
      expect(generator.fieldIdToQuestion.size).toEqual(0)
    })
  })

  describe('process()', () => {
    it('should set hasBeenProcessed to true after first call', () => {
      // Arrange
      expect(generator.hasBeenProcessed).toBe(false)
      // Act + Assert
      generator.process()
      expect(generator.hasBeenProcessed).toBe(true)
    })

    describe('submissions with only answer key', () => {
      it('should handle a single submission', () => {
        // Arrange
        const mockDecryptedRecord = [
          generateRecord(1),
          generateRecord(2),
          generateRecord(3),
          generateRecord(4),
        ]
        const mockRecord = {
          record: mockDecryptedRecord,
          created: mockCreatedEarly,
          submissionId: 'mockSubmissionId',
        }
        generator.addRecord(mockRecord)
        // Should have unprocessed record
        expect(generator.unprocessed.length).toEqual(1)

        // Act
        generator.process()

        // Assert
        // Should have 1 header row and 1 submission row
        expect(generator.records.length).toEqual(2 + BOM_LENGTH)
        const expectedHeaderRow = stringify([
          'Response ID',
          'Timestamp',
          mockDecryptedRecord[0].question,
          mockDecryptedRecord[1].question,
          mockDecryptedRecord[2].question,
          mockDecryptedRecord[3].question,
        ])
        const expectedSubmissionRow = stringify([
          mockRecord.submissionId,
          moment(mockRecord.created)
            .tz('Asia/Singapore')
            .format('DD MMM YYYY hh:mm:ss A'),
          mockDecryptedRecord[0].answer,
          mockDecryptedRecord[1].answer,
          mockDecryptedRecord[2].answer,
          mockDecryptedRecord[3].answer,
        ])
        expect(generator.records).toEqual([
          UTF8_BYTE_ORDER_MARK,
          expectedHeaderRow,
          expectedSubmissionRow,
        ])
      })

      it('should handle later submissions with edited ordering', () => {
        // Arrange
        const mockFirstDecryptedRecord = [
          generateRecord(1),
          generateRecord(2),
          generateRecord(3),
          generateRecord(4),
        ]
        const mockFirstRecord = {
          record: mockFirstDecryptedRecord,
          created: mockCreatedEarly,
          submissionId: 'mockSubmissionId',
        }

        // Record with reversed question order, but have same field ids.
        const mockReversedDecryptedRecord = [
          generateRecord(4),
          generateRecord(3),
          generateRecord(2),
          generateRecord(1),
        ]
        const mockReversedRecord = {
          record: mockReversedDecryptedRecord,
          created: mockCreatedLater,
          submissionId: 'mockSubmissionId2',
        }

        // Act
        generator.addRecord(mockFirstRecord)
        generator.addRecord(mockReversedRecord)
        // Should have 2 unprocessed records
        expect(generator.unprocessed.length).toEqual(2)
        generator.process()

        // Assert
        // Should have 1 header row and 2 submission row
        expect(generator.records.length).toEqual(3 + BOM_LENGTH)
        const expectedHeaderRow = stringify([
          'Response ID',
          'Timestamp',
          mockFirstDecryptedRecord[0].question,
          mockFirstDecryptedRecord[1].question,
          mockFirstDecryptedRecord[2].question,
          mockFirstDecryptedRecord[3].question,
        ])
        const expectedSubmissionRow1 = stringify([
          mockFirstRecord.submissionId,
          moment(mockFirstRecord.created)
            .tz('Asia/Singapore')
            .format('DD MMM YYYY hh:mm:ss A'),
          mockFirstDecryptedRecord[0].answer,
          mockFirstDecryptedRecord[1].answer,
          mockFirstDecryptedRecord[2].answer,
          mockFirstDecryptedRecord[3].answer,
        ])
        // Second processed row should be mockReversedRecord's answers in reversed
        // order since the fieldIds are reversed
        const expectedSubmissionRow2 = stringify([
          mockReversedRecord.submissionId,
          moment(mockReversedRecord.created)
            .tz('Asia/Singapore')
            .format('DD MMM YYYY hh:mm:ss A'),
          mockReversedDecryptedRecord[3].answer,
          mockReversedDecryptedRecord[2].answer,
          mockReversedDecryptedRecord[1].answer,
          mockReversedDecryptedRecord[0].answer,
        ])

        expect(generator.records).toEqual([
          UTF8_BYTE_ORDER_MARK,
          expectedHeaderRow,
          expectedSubmissionRow1,
          expectedSubmissionRow2,
        ])
      })

      it('should handle later submissions with new questions', () => {
        // Arrange
        const intersectFieldId = 'intersect'
        const mockDecryptedRecord = [
          generateRecord(1),
          generateRecord(2),
          generateRecord(3),
          generateRecord(intersectFieldId),
        ]
        const mockRecord = {
          record: mockDecryptedRecord,
          created: mockCreatedEarly,
          submissionId: 'mockSubmissionId',
        }

        // Record with a new fieldId, along with one of the older fieldIds
        const newDecryptedRecord = [
          generateRecord('new'),
          generateRecord(intersectFieldId),
        ]
        const mockNewRecord = {
          record: newDecryptedRecord,
          created: mockCreatedLater,
          submissionId: 'mockSubmissionId2',
        }
        generator.addRecord(mockRecord)
        generator.addRecord(mockNewRecord)

        // Act
        generator.process()

        // Assert
        // Should have 1 header row and 2 submission row
        expect(generator.records.length).toEqual(3 + BOM_LENGTH)
        const expectedHeaderRow = stringify([
          'Response ID',
          'Timestamp',
          mockDecryptedRecord[0].question,
          mockDecryptedRecord[1].question,
          mockDecryptedRecord[2].question,
          mockDecryptedRecord[3].question,
          // Should have the `new` question from mockNewRecord last since it is
          // added later
          newDecryptedRecord[0].question,
        ])

        // First row should be the first submission
        const expectedSubmissionRow1 = stringify([
          mockRecord.submissionId,
          moment(mockRecord.created)
            .tz('Asia/Singapore')
            .format('DD MMM YYYY hh:mm:ss A'),
          mockDecryptedRecord[0].answer,
          mockDecryptedRecord[1].answer,
          mockDecryptedRecord[2].answer,
          mockDecryptedRecord[3].answer,
          // Should have extra blank space due to new header
          '',
        ])
        // Second processed row should be second submission, with fields it does
        // not have blank.
        // Should only have questionId of `intersectFieldId` and `new` filled.
        const expectedSubmissionRow2 = stringify([
          mockNewRecord.submissionId,
          moment(mockNewRecord.created)
            .tz('Asia/Singapore')
            .format('DD MMM YYYY hh:mm:ss A'),
          '',
          '',
          '',
          // Others should be blank, but the later 'intersect' key should be first
          newDecryptedRecord[1].answer,
          newDecryptedRecord[0].answer,
        ])
        expect(generator.records).toEqual([
          UTF8_BYTE_ORDER_MARK,
          expectedHeaderRow,
          expectedSubmissionRow1,
          expectedSubmissionRow2,
        ])
      })
    })

    describe('submissions with answerArray key', () => {
      it('should handle only submissions with checkbox answerArray', () => {
        // Arrange
        const mockDecryptedRecord = [
          generateRecord(1, ['abc', 'def'], 'checkbox'),
        ]
        const mockRecord = {
          record: mockDecryptedRecord,
          created: mockCreatedEarly,
          submissionId: 'mockSubmissionId',
        }
        generator.addRecord(mockRecord)

        // Act
        generator.process()

        // Assert
        // Should have 1 header row and 1 submission row
        expect(generator.records.length).toEqual(2 + BOM_LENGTH)
        const expectedHeaderRow = stringify([
          'Response ID',
          'Timestamp',
          mockDecryptedRecord[0].question,
        ])

        const expectedSubmissionRow = stringify([
          mockRecord.submissionId,
          moment(mockRecord.created)
            .tz('Asia/Singapore')
            .format('DD MMM YYYY hh:mm:ss A'),
          // Answer array values should be joined by a semicolon
          mockDecryptedRecord[0].answerArray.join(';'),
        ])

        expect(generator.records).toEqual([
          UTF8_BYTE_ORDER_MARK,
          expectedHeaderRow,
          expectedSubmissionRow,
        ])
      })

      it('should handle only submissions with table answerArray', () => {
        // Arrange
        const mockDecryptedRecord = [
          generateRecord(
            1,
            [
              ['abc', 'def'],
              ['ghi', 'jkl'],
            ],
            'table',
          ),
        ]
        const mockRecord = {
          record: mockDecryptedRecord,
          created: mockCreatedEarly,
          submissionId: 'mockSubmissionId',
        }
        generator.addRecord(mockRecord)

        // Act
        generator.process()

        // Assert
        // Should have 1 header row and 1 submission row
        expect(generator.records.length).toEqual(2 + BOM_LENGTH)
        // Question is repeated for two columns
        const expectedHeaderRow = stringify([
          'Response ID',
          'Timestamp',
          mockDecryptedRecord[0].question,
          mockDecryptedRecord[0].question,
        ])

        const expectedSubmissionRow = stringify([
          mockRecord.submissionId,
          moment(mockRecord.created)
            .tz('Asia/Singapore')
            .format('DD MMM YYYY hh:mm:ss A'),
          // Answer array values should be joined by a semicolon
          mockDecryptedRecord[0].answerArray[0].join(';'),
          mockDecryptedRecord[0].answerArray[1].join(';'),
        ])

        expect(generator.records).toEqual([
          UTF8_BYTE_ORDER_MARK,
          expectedHeaderRow,
          expectedSubmissionRow,
        ])
      })

      it('should handle submissions with mixed answerArray and answer params with same fieldId', () => {
        // Arrange
        const mockAnswerArray = [generateRecord(1, ['abc', 'def'], 'checkbox')]
        const mockAnswerArrayRecord = {
          record: mockAnswerArray,
          created: mockCreatedEarly,
          submissionId: 'mockSubmissionIdAnswerArray',
        }
        const mockAnswer = [generateRecord(1)]
        const mockAnswerRecord = {
          record: mockAnswer,
          created: mockCreatedLater,
          submissionId: 'mockSubmissionIdAnswer',
        }
        generator.addRecord(mockAnswerArrayRecord)
        generator.addRecord(mockAnswerRecord)

        // Act
        generator.process()

        // Assert
        // Should have 1 header row and 2 submission rows
        expect(generator.records.length).toEqual(3 + BOM_LENGTH)
        const expectedHeaderRow = stringify([
          'Response ID',
          'Timestamp',
          mockAnswerArray[0].question,
        ])

        // First row is answer array
        const expectedSubmissionRow1 = stringify([
          mockAnswerArrayRecord.submissionId,
          moment(mockAnswerArrayRecord.created)
            .tz('Asia/Singapore')
            .format('DD MMM YYYY hh:mm:ss A'),
          // Answer array values should be joined by a semicolon
          mockAnswerArray[0].answerArray.join(';'),
        ])
        // Second row is answer, but same field Id, so same number of headers
        const expectedSubmissionRow2 = stringify([
          mockAnswerRecord.submissionId,
          moment(mockAnswerRecord.created)
            .tz('Asia/Singapore')
            .format('DD MMM YYYY hh:mm:ss A'),
          // Answer array values should be joined by a semicolon
          mockAnswer[0].answer,
        ])

        expect(generator.records).toEqual([
          UTF8_BYTE_ORDER_MARK,
          expectedHeaderRow,
          expectedSubmissionRow1,
          expectedSubmissionRow2,
        ])
      })
    })
  })
})
