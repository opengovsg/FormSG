import {
  defaultErrorMessage,
  getMongoErrorMessage,
} from 'src/app/controllers/errors.server.controller'

describe('Errors Controller', () => {
  describe('getMongoErrorMessage', () => {
    it('should return blank string if no error', () => {
      expect(getMongoErrorMessage()).toEqual('')
    })

    it('should return string if error is string', () => {
      const err = 'something failed'
      expect(getMongoErrorMessage(err)).toEqual(err)
    })

    it('should call mongoDuplicateKeyError helperif error code is 11000 or 11001 (with field name)', () => {
      const err = {
        err:
          'E11000 duplicate key error index: test.so.$foo_1  dup key: { : 5.0 }',
        code: 11001,
        n: 0,
        nPrev: 1,
        ok: 1,
      }
      const expected = 'Foo already exists'
      expect(getMongoErrorMessage(err)).toEqual(expected)
    })

    it('should call mongoDuplicateKeyError helper if error code is 11000 or 11001 (no error msg)', () => {
      const err = {
        code: 11000,
        n: 0,
        nPrev: 1,
        ok: 1,
      }
      const expected = 'Unique field already exists'
      expect(getMongoErrorMessage(err)).toEqual(expected)
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
