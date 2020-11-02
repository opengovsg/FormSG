const { StatusCodes } = require('http-status-codes')

const Controller = spec(
  'dist/backend/app/controllers/public-forms.server.controller',
)

describe('Public-Forms Controller', () => {
  // Declare global variables
  let req
  let res

  beforeEach(async () => {
    req = {
      query: {},
      params: {},
      body: {},
      headers: {},
      url: '',
      ip: '127.0.0.1',
      get: () => '',
    }

    res = jasmine.createSpyObj('res', ['status', 'send', 'json'])
  })

  describe('isFormPublic', () => {
    it('should pass on to the next middleware if form is public', () => {
      req.form = {
        status: 'PUBLIC',
      }
      let next = jasmine.createSpy()
      Controller.isFormPublic(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('should return a 404 error if form is not public', (done) => {
      req.form = {
        status: 'PRIVATE',
      }
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
        done()
        return res
      })
      Controller.isFormPublic(req, res, () => {})
    })
  })
})
