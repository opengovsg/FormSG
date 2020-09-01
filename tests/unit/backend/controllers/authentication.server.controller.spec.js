const { StatusCodes } = require('http-status-codes')
const mongoose = require('mongoose')

const dbHandler = require('../helpers/db-handler')
let roles = require('../helpers/roles')
let permissionLevels = require('../../../../dist/backend/app/utils/permission-levels')
  .default

describe('Authentication Controller', () => {
  const TEST_OTP = '123456'
  const bcrypt = jasmine.createSpyObj('bcrypt', ['hash'])
  const mockSendNodeMail = jasmine.createSpy()

  const Controller = spec(
    'dist/backend/app/controllers/authentication.server.controller',
    {
      mongoose: Object.assign(mongoose, { '@noCallThru': true }),
      '../utils/otp': {
        generateOtp: () => TEST_OTP,
      },
      '../services/mail.service': {
        sendNodeMail: mockSendNodeMail,
      },
      bcrypt,
    },
  )

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
      session: {
        user: {
          _id: mongoose.Types.ObjectId('000000000001'),
          email: 'test@test.gov.sg',
        },
      },
      headers: {},
      ip: '127.0.0.1',
      get: () => '',
    }

    res = jasmine.createSpyObj('res', ['status', 'send', 'json'])
    res.locals = {}

    const collections = await dbHandler.preloadCollections({
      userId: req.session.user._id,
    })

    // Insert test form before each test
    testForm = collections.form
  })

  describe('authenticateUser', () => {
    it('should pass on to the next middleware if authenticated', () => {
      let next = jasmine.createSpy()
      Controller.authenticateUser(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('should return 401 if not authenticated', (done) => {
      req.session = null
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED)
        done()
        return res
      })
      Controller.authenticateUser(req, res, () => {})
    })
  })

  describe('hasFormAdminAuthorization', () => {
    it('should authorize if session user is admin', () => {
      let next = jasmine.createSpy()
      // Populate admin with partial user object
      let testFormObj = testForm.toObject()
      testFormObj.admin = { id: req.session.user._id }
      req.form = testFormObj
      Controller.verifyPermission(permissionLevels.DELETE)(req, res, next)
      expect(next).toHaveBeenCalled()
    })
    it('should authorize if session user is a collaborator', () => {
      let next = jasmine.createSpy()
      // Populate admin with partial user object
      let testFormObj = testForm.toObject()
      testFormObj.admin = { id: mongoose.Types.ObjectId('000000000002') }
      testFormObj.permissionList.push(
        roles.collaborator(req.session.user.email),
      )
      req.form = testFormObj
      Controller.verifyPermission(permissionLevels.WRITE)(req, res, next)
      expect(next).toHaveBeenCalled()
    })
    it('should not authorize if session user is not a collaborator nor admin', () => {
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
        return res
      })
      // Populate admin with partial user object
      let testFormObj = testForm.toObject()
      testFormObj.admin = { id: mongoose.Types.ObjectId('000000000002') }
      req.form = testFormObj
      Controller.verifyPermission(permissionLevels.WRITE)(req, res, () => {})
    })
  })
})
