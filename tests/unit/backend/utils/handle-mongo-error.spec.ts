import { MongoError } from 'mongodb'
import { Error as MongooseError } from 'mongoose'

import { getMongoErrorMessage } from 'src/app/utils/handle-mongo-error'

describe('handleMongoError', () => {
  describe('getMongoErrorMessage', () => {
    it('should return blank string if no error', () => {
      expect(getMongoErrorMessage()).toEqual('')
    })

    it('should return string if error is string', () => {
      const err = 'something failed'
      expect(getMongoErrorMessage(err)).toEqual(err)
    })

    it('should return form too large error message for error code 10334', () => {
      const err = new MongoError('MongoError')
      err.code = 10334

      expect(getMongoErrorMessage(err)).toEqual(
        'Your form is too large to be supported by the system.',
      )
    })

    it('should return default error message for other MongoError error code', () => {
      const err = new MongoError('MongoError')
      expect(getMongoErrorMessage(err)).toEqual(
        'An unexpected error happened. Please try again.',
      ) // Preset default error message
      expect(getMongoErrorMessage(err, 'new error message')).toEqual(
        'new error message',
      ) // Changed default error message
    })

    it('should join all error messages into a single message if available.', () => {
      const err = new MongooseError.ValidationError()
      const err1 = new MongooseError.ValidatorError({})
      err1.message = 'abc'
      const err2 = new MongooseError.ValidatorError({})
      err2.message = 'def'
      err.errors = { err1, err2 }
      expect(getMongoErrorMessage(err)).toEqual('abc, def')
    })

    it('should return error message for MongooseError', () => {
      const err = new MongooseError('mongooseError')
      expect(getMongoErrorMessage(err)).toEqual('mongooseError')
    })
  })
})
