describe('Errors Controller', () => {
  const controller = spec(
    'dist/backend/app/controllers/errors.server.controller',
  )

  describe('getMongoErrorMessage', () => {
    it('should return blank string if no error', () => {
      expect(controller.getMongoErrorMessage()).toEqual('')
    })

    it('should return string if error is string', () => {
      let err = 'something failed'
      expect(controller.getMongoErrorMessage(err)).toEqual(err)
    })

    it('should call mongoDuplicateKeyError helperif error code is 11000 or 11001 (with field name)', () => {
      let err = {
        err:
          'E11000 duplicate key error index: test.so.$foo_1  dup key: { : 5.0 }',
        code: 11001,
        n: 0,
        nPrev: 1,
        ok: 1,
      }
      let expected = 'Foo already exists'
      expect(controller.getMongoErrorMessage(err)).toEqual(expected)
    })

    it('should call mongoDuplicateKeyError helper if error code is 11000 or 11001 (no error msg)', () => {
      let err = {
        code: 11000,
        n: 0,
        nPrev: 1,
        ok: 1,
      }
      let expected = 'Unique field already exists'
      expect(controller.getMongoErrorMessage(err)).toEqual(expected)
    })

    it('should return error message for other error code', () => {
      let err = {
        code: 12,
        n: 0,
        nPrev: 1,
        ok: 1,
      }
      expect(controller.getMongoErrorMessage(err)).toEqual(
        controller.defaultErrorMessage,
      )
    })

    it('should return error message if no error code', () => {
      let err = {
        errors: {
          error1: {
            message: 'error message 1',
          },
        },
      }
      expect(controller.getMongoErrorMessage(err)).toEqual(
        err.errors.error1.message,
      )
    })
  })
})
