/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Error as MongooseError, mongo as mongodb } from 'mongoose'

import {
  formatErrorRecoveryMessage,
  getMongoErrorMessage,
} from 'src/app/utils/handle-mongo-error'

const { MongoError } = mongodb

describe('handleMongoError', () => {
  describe('getMongoErrorMessage', () => {
    it('should return blank string if no error', () => {
      expect(getMongoErrorMessage()).toEqual('')
    })

    it('should return formatted string if error is string', () => {
      const err = 'something failed'
      expect(getMongoErrorMessage(err)).toEqual(formatErrorRecoveryMessage(err))
    })

    it('should return form too large error message for error code 10334', () => {
      const err = new MongoError('MongoError')
      err.code = 10334

      expect(getMongoErrorMessage(err)).toEqual(
        formatErrorRecoveryMessage(
          'Your form is too large to be supported by the system.',
        ),
      )
    })

    it('should return default error message for other MongoError error code', () => {
      const err = new MongoError('MongoError')
      expect(getMongoErrorMessage(err)).toEqual(
        formatErrorRecoveryMessage(
          'An unexpected error happened. Please try again.',
        ),
      ) // Preset default error message
      expect(getMongoErrorMessage(err, 'new error message')).toEqual(
        formatErrorRecoveryMessage('new error message'),
      ) // Changed default error message
    })

    it('should join all error messages into a single message if available.', () => {
      // @ts-ignore
      const err = new MongooseError.ValidationError()
      // @ts-ignore
      const err1 = new MongooseError.ValidatorError({})
      err1.message = 'abc'
      // @ts-ignore
      const err2 = new MongooseError.ValidatorError({})
      err2.message = 'def'
      err.errors = { err1, err2 }
      expect(getMongoErrorMessage(err)).toEqual(
        formatErrorRecoveryMessage('abc, def'),
      )
    })

    it('should return error message for MongooseError', () => {
      const err = new MongooseError('mongooseError')
      expect(getMongoErrorMessage(err)).toEqual(
        formatErrorRecoveryMessage('mongooseError'),
      )
    })
  })

  describe('formatErrorRecoveryMessage', () => {
    it('should format given string', () => {
      // Arrange
      const errorString = 'some test string'

      // Act
      const actual = formatErrorRecoveryMessage(errorString)

      // Assert
      expect(actual).toEqual(
        `Error: [${errorString}]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.`,
      )
    })
  })
})
