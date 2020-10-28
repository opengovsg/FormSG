const { StatusCodes } = require('http-status-codes')
const mongoose = require('mongoose')

const dbHandler = require('../helpers/db-handler')
const FormFeedback = dbHandler.makeModel(
  'form_feedback.server.model',
  'FormFeedback',
)

const Controller = spec(
  'dist/backend/app/controllers/public-forms.server.controller',
  {
    mongoose: Object.assign(mongoose, { '@noCallThru': true }),
  },
)

describe('Public-Forms Controller', () => {
  // Declare global variables
  let req
  let res
  let testForm

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

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

    // Insert test form before each test
    const collection = await dbHandler.preloadCollections()
    testForm = collection.form
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

  describe('redirect', () => {
    it('should redirect to form with hashbang prepended', (done) => {
      req.params = {
        Id: '321564654f65we4f65e4f5',
      }
      res.redirect = jasmine.createSpy().and.callFake(() => {
        expect(res.redirect).toHaveBeenCalledWith('/#!/321564654f65we4f65e4f5')
        done()
      })
      Controller.redirect(req, res)
    })

    it('should redirect to form with hashbang prepended and state retained', (done) => {
      req.params = {
        Id: '321564654f65we4f65e4f5',
        state: 'preview',
      }
      res.redirect = jasmine.createSpy().and.callFake(() => {
        expect(res.redirect).toHaveBeenCalledWith(
          '/#!/321564654f65we4f65e4f5/preview',
        )
        done()
      })
      Controller.redirect(req, res)
    })

    it('should redirect to form with query params retained if they are valid format', (done) => {
      req.params = {
        Id: '321564654f65we4f65e4f5',
      }
      req.url = '/321564654f65we4f65e4f5?abc=def&zzz=yyy'
      const uriString = encodeURIComponent('abc=def&zzz=yyy')
      res.redirect = jasmine.createSpy().and.callFake(() => {
        expect(res.redirect).toHaveBeenCalledWith(
          `/#!/321564654f65we4f65e4f5?${uriString}`,
        )
        done()
      })
      Controller.redirect(req, res)
    })

    it('should redirect to form without query params if they are invalid format', (done) => {
      req.params = {
        Id: '321564654f65we4f65e4f5',
      }
      req.url = '/321564654f65we4f65e4f5?abc'
      res.redirect = jasmine.createSpy().and.callFake(() => {
        expect(res.redirect).toHaveBeenCalledWith('/#!/321564654f65we4f65e4f5')
        done()
      })
      Controller.redirect(req, res)
    })

    it('should render index if getting fetchMetatags succeeds', (done) => {
      req.params = {
        Id: testForm._id,
      }
      req.get = function (property) {
        return req[property]
      }
      res.render = jasmine.createSpy().and.callFake(() => {
        expect(res.render).toHaveBeenCalled()
        done()
      })
      Controller.redirect(req, res)
    })

    it('should redirect if getting fetchMetatags fails', (done) => {
      req.params = {
        Id: '321564654f65we4f65e4f5',
      }
      req.get = function (property) {
        return req[property]
      }
      res.redirect = jasmine.createSpy().and.callFake(() => {
        expect(res.redirect).toHaveBeenCalledWith('/#!/321564654f65we4f65e4f5')
        done()
      })
      Controller.redirect(req, res)
    })
  })

  describe('submitFeedback', () => {
    it('should return a 400 error if there are missing params', () => {
      _.forEach(['params.formId', 'body.rating', 'body.comment'], (path) => {
        req.body = {
          rating: 4,
          comment: 'good',
        }
        req.params = {
          formId: mongoose.Types.ObjectId(),
        }
        // Removes a param
        _.unset(req, path)
        res.status = jasmine.createSpy().and.callFake(() => {
          return res
        })
        Controller.submitFeedback(req, res)
        expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      })
    })

    it('should return a 500 error if form feedback could not be created', (done) => {
      // Malformed parameters
      req.body = {
        rating: 7,
        comment: 'good',
      }
      req.params = {
        formId: mongoose.Types.ObjectId(),
      }
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(
          StatusCodes.INTERNAL_SERVER_ERROR,
        )
        done()
        return res
      })
      Controller.submitFeedback(req, res)
    })

    it('should successfully save form feedback', (done) => {
      req.body = {
        rating: 4,
        comment: 'good',
      }
      req.params = {
        formId: mongoose.Types.ObjectId(),
      }
      res.status.and.callFake((args) => {
        expect(args).toBe(StatusCodes.OK)
        return res
      })
      res.json.and.callFake(() => {
        FormFeedback.findOne(
          {
            formId: req.params.formId,
            rating: req.body.rating,
            comment: req.body.comment,
          },
          (err, feedback) => {
            expect(err).toBeNull()
            expect(feedback).toBeDefined()
            done()
          },
        )
      })
      Controller.submitFeedback(req, res)
    })
  })
})
