const { StatusCodes } = require('http-status-codes')
const mongoose = require('mongoose')
const { ObjectId } = require('bson-ext')

const dbHandler = require('../helpers/db-handler')
const Form = dbHandler.makeModel('form.server.model', 'Form')

const Controller = spec(
  'dist/backend/app/controllers/forms.server.controller',
  {
    mongoose: Object.assign(mongoose, { '@noCallThru': true }),
  },
)

describe('Form Controller', () => {
  // Declare global variables
  let req
  let res
  let testForm

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  beforeEach(async () => {
    res = jasmine.createSpyObj('res', ['status', 'send', 'json'])

    const { form, user } = await dbHandler.preloadCollections()
    testForm = form
    req = {
      query: {},
      params: {},
      body: {},
      session: {
        user: {
          _id: user._id,
          email: user.email,
        },
      },
      headers: {},
      ip: '127.0.0.1',
      get: () => this.ip,
    }
  })

  describe('read (admin)', () => {
    it('should send response with required args', () => {
      req.form = testForm.toJSON()
      res.locals = {
        spcpSession: {},
        myInfoError: {},
      }
      // Expected form should not contain sensitive user info
      let expectedForm = testForm.toJSON()
      expectedForm.admin = _.pick(testForm.admin, [
        'agency',
        'email',
        'betaFlags',
      ])
      Controller.read(Controller.REQUEST_TYPE.ADMIN)(req, res)
      expect(res.json).toHaveBeenCalledWith({
        form: expectedForm,
        spcpSession: res.locals.spcpSession,
        myInfoError: res.locals.myInfoError,
        isIntranetUser: false,
      })
    })
  })

  describe('read (public)', () => {
    it('should send response with required args', () => {
      req.form = testForm.toJSON()
      res.locals = {
        spcpSession: {},
        myInfoError: {},
      }

      // Expected form should not contain sensitive user info
      let expectedForm = testForm.toJSON()
      expectedForm.admin = _.pick(testForm.admin, ['agency'])
      // Expected form for public use should not contain certain things that are included in admin forms
      expectedForm = _.pick(expectedForm, [
        'admin',
        'authType',
        'endPage',
        'esrvcId',
        'form_fields',
        'form_logics',
        'hasCaptcha',
        'publicKey',
        'startPage',
        'status',
        'title',
        '_id',
        'responseMode',
      ])

      Controller.read(Controller.REQUEST_TYPE.PUBLIC)(req, res)
      expect(res.json).toHaveBeenCalledWith({
        form: expectedForm,
        spcpSession: res.locals.spcpSession,
        myInfoError: res.locals.myInfoError,
        isIntranetUser: false,
      })
    })
  })

  describe('formById', () => {
    it('should return a 400 error if form id is invalid', () => {
      let id = 'invalid_id'
      res.status.and.callFake(() => {
        return res
      })
      Controller.formById(req, res, null, id)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })

    it('should return a 404 error if form id is not found', (done) => {
      req.params.formId = mongoose.Types.ObjectId()
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
        done()
        return res
      })
      Controller.formById(req, res, null)
    })

    it('should return a 500 error if admin is not a valid user', (done) => {
      let invalidForm = new Form({
        title: 'Test Form',
        emails: 'test@test.gov.sg',
        admin: new ObjectId(), // Random admin id
      })
      req.params.formId = invalidForm._id
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(
          StatusCodes.INTERNAL_SERVER_ERROR,
        )
        done()
        return res
      })

      // Disable validation since invalid admin id will prevent document from
      // being saved if validation is turned on.
      // This test is for backwards compatibility before form creation had the
      // user validation stage.
      invalidForm.save({ validateBeforeSave: false }).then(() => {
        Controller.formById(req, res, null)
      })
    })

    it('should populate form and pass on to next middleware if valid', (done) => {
      req.params.formId = testForm._id
      res.status.and.callFake((_args) => {
        return res
      })
      let next = jasmine.createSpy().and.callFake(() => {
        expect(next).toHaveBeenCalled()
        done()
      })
      Controller.formById(req, res, next)
    })
  })
})
