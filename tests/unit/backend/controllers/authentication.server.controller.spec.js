const { StatusCodes } = require('http-status-codes')
const mongoose = require('mongoose')
const {
  PermissionLevel,
} = require('../../../../dist/backend/app/modules/form/admin-form/admin-form.types')

const dbHandler = require('../helpers/db-handler')
let roles = require('../helpers/roles')

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
      '../services/mail/mail.service': {
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

  describe('hasFormAdminAuthorization', () => {
    it('should authorize if session user is admin', () => {
      let next = jasmine.createSpy()
      // Populate admin with partial user object
      let testFormObj = testForm.toObject()
      testFormObj.admin = { id: req.session.user._id }
      req.form = testFormObj
      Controller.verifyPermission(PermissionLevel.Delete)(req, res, next)
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
      Controller.verifyPermission(PermissionLevel.Write)(req, res, next)
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
      Controller.verifyPermission(PermissionLevel.Write)(req, res, () => {})
    })
  })
})
