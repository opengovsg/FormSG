import { getMongoErrorMessage } from 'src/app/controllers/errors.server.controller'

const defaultErrorMessage = 'An unexpected error happened. Please try again.'

describe('Errors Controller', () => {
  describe('getMongoErrorMessage', () => {
    it('should return blank string if no error', () => {
      expect(getMongoErrorMessage()).toEqual('')
    })

    it('should return string if error is string', () => {
      const err = 'something failed'
      expect(getMongoErrorMessage(err)).toEqual(err)
    })

    it('should return error message for other error code', () => {
      const err = {
        code: 12,
        n: 0,
        nPrev: 1,
        ok: 1,
      }
      expect(getMongoErrorMessage(err)).toEqual(defaultErrorMessage)
    })

    it('should return error message if no error code', () => {
      const err = {
        errors: {
          error1: {
            message: 'error message 1',
          },
        },
      }
      expect(getMongoErrorMessage(err)).toEqual(err.errors.error1.message)
    })
  })
})
