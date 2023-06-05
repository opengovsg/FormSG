import { stringify } from 'csv-string'
import moment from 'moment-timezone'

import { DateString, FormFeedbackDto, FormId } from '~shared/types'

import { FeedbackCsvGenerator } from './FeedbackCsvGenerator'

const UTF8_BYTE_ORDER_MARK = '\uFEFF'

describe('FeedbackCsvGenerator', () => {
  afterAll(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialise the instance properties correctly with default numOfMetaDataRows', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const feedbackCsv = new FeedbackCsvGenerator(expectedNumberOfRecords)

      // Assert
      expect(feedbackCsv.expectedNumberOfRecords).toEqual(
        expectedNumberOfRecords,
      )
      expect(feedbackCsv.numOfMetaDataRows).toEqual(0) //Default value
      expect(feedbackCsv.numOfHeaderRows).toEqual(1)
      expect(feedbackCsv.lastCreatedAt).toEqual(0)
      expect(feedbackCsv.startIdx).toEqual(2)
      expect(feedbackCsv.idx).toEqual(2)
      expect(feedbackCsv.records.length).toEqual(
        expectedNumberOfRecords + 0 + 2,
      )
      expect(feedbackCsv.records[0]).toEqual(UTF8_BYTE_ORDER_MARK)
    })
  })

  describe('addLineFromFeedback', () => {
    it('should insert feedback line correctly when feedback.created is undefined', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const feedbackCsv = new FeedbackCsvGenerator(expectedNumberOfRecords)
      const MOCK_FEEDBACK_COMMENT = 'great!'
      const MOCK_FEEDBACK_RATING = 5
      const lineToAdd: FormFeedbackDto = {
        rating: MOCK_FEEDBACK_RATING,
        comment: MOCK_FEEDBACK_COMMENT,
        formId: 'formId' as FormId,
      }

      const MOCK_CREATED_TIME = moment().toISOString()
      const MOCK_CREATED_TIME_SG_STRING = moment(MOCK_CREATED_TIME)
        .tz('Asia/Singapore')
        .format('DD MMM YYYY hh:mm:ss A')

      const expectedLineAdded = stringify([
        MOCK_CREATED_TIME_SG_STRING,
        MOCK_FEEDBACK_COMMENT,
        MOCK_FEEDBACK_RATING,
      ])

      // Act
      feedbackCsv.addLineFromFeedback(lineToAdd)

      // Assert
      expect(feedbackCsv.idx).toEqual(3) // Add 3 because line added
      expect(feedbackCsv.records.length).toEqual(
        expectedNumberOfRecords + 0 + 2,
      )
      expect(feedbackCsv.records[2]).toEqual(expectedLineAdded)
    })

    it('should insert feedback line correctly when feedback.created is defined', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const feedbackCsv = new FeedbackCsvGenerator(expectedNumberOfRecords)
      const MOCK_FEEDBACK_COMMENT = 'great!'
      const MOCK_FEEDBACK_RATING = 5
      const MOCK_CREATED_TIME = moment().toISOString()
      const MOCK_CREATED_TIME_SG_STRING = moment(MOCK_CREATED_TIME)
        .tz('Asia/Singapore')
        .format('DD MMM YYYY hh:mm:ss A')
      const lineToAdd: FormFeedbackDto = {
        rating: MOCK_FEEDBACK_RATING,
        comment: MOCK_FEEDBACK_COMMENT,
        formId: 'formId' as FormId,
        created: MOCK_CREATED_TIME as DateString,
      }
      const expectedLineAdded = stringify([
        MOCK_CREATED_TIME_SG_STRING,
        MOCK_FEEDBACK_COMMENT,
        MOCK_FEEDBACK_RATING,
      ])

      // Act
      feedbackCsv.addLineFromFeedback(lineToAdd)

      // Assert
      expect(feedbackCsv.idx).toEqual(3) // Add 3 because line added
      expect(feedbackCsv.records.length).toEqual(
        expectedNumberOfRecords + 0 + 2,
      )
      expect(feedbackCsv.records[2]).toEqual(expectedLineAdded)
    })

    it('should insert feedback line correctly when feedback.lastModified is defined', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const feedbackCsv = new FeedbackCsvGenerator(expectedNumberOfRecords)
      const MOCK_FEEDBACK_COMMENT = 'great!'
      const MOCK_FEEDBACK_RATING = 5
      const MOCK_CREATED_TIME = moment().toISOString()
      const MOCK_CREATED_TIME_SG_STRING = moment(MOCK_CREATED_TIME)
        .tz('Asia/Singapore')
        .format('DD MMM YYYY hh:mm:ss A')
      const MOCK_MODIFIED_TIME = moment().toISOString()
      const lineToAdd: FormFeedbackDto = {
        rating: MOCK_FEEDBACK_RATING,
        comment: MOCK_FEEDBACK_COMMENT,
        formId: 'formId' as FormId,
        created: MOCK_CREATED_TIME as DateString,
        lastModified: MOCK_MODIFIED_TIME as DateString,
      }
      const expectedLineAdded = stringify([
        MOCK_CREATED_TIME_SG_STRING,
        MOCK_FEEDBACK_COMMENT,
        MOCK_FEEDBACK_RATING,
      ])

      // Act
      feedbackCsv.addLineFromFeedback(lineToAdd)

      // Assert
      expect(feedbackCsv.idx).toEqual(3) // Add 3 because line added
      expect(feedbackCsv.records.length).toEqual(
        expectedNumberOfRecords + 0 + 2,
      )
      expect(feedbackCsv.records[2]).toEqual(expectedLineAdded)
    })

    it('should insert feedback line correctly when feedback.submissionId is defined', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const feedbackCsv = new FeedbackCsvGenerator(expectedNumberOfRecords)
      const MOCK_FEEDBACK_COMMENT = 'great!'
      const MOCK_FEEDBACK_RATING = 5
      const MOCK_CREATED_TIME = moment().toISOString()
      const MOCK_CREATED_TIME_SG_STRING = moment(MOCK_CREATED_TIME)
        .tz('Asia/Singapore')
        .format('DD MMM YYYY hh:mm:ss A')
      const MOCK_SUBMISSION_ID = 'submissionId'
      const lineToAdd: FormFeedbackDto = {
        rating: MOCK_FEEDBACK_RATING,
        comment: MOCK_FEEDBACK_COMMENT,
        formId: 'formId' as FormId,
        created: MOCK_CREATED_TIME as DateString,
        submissionId: MOCK_SUBMISSION_ID,
      }
      const expectedLineAdded = stringify([
        MOCK_CREATED_TIME_SG_STRING,
        MOCK_FEEDBACK_COMMENT,
        MOCK_FEEDBACK_RATING,
      ])

      // Act
      feedbackCsv.addLineFromFeedback(lineToAdd)

      // Assert
      expect(feedbackCsv.idx).toEqual(3) // Add 3 because line added
      expect(feedbackCsv.records.length).toEqual(
        expectedNumberOfRecords + 0 + 2,
      )
      expect(feedbackCsv.records[2]).toEqual(expectedLineAdded)
    })
  })
})
