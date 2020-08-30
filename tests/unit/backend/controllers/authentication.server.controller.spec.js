const HttpStatus = require('http-status-codes')
const mongoose = require('mongoose')

const dbHandler = require('../helpers/db-handler')
let roles = require('../helpers/roles')
let permissionLevels = require('../../../../dist/backend/app/utils/permission-levels')

const User = dbHandler.makeModel('user.server.model', 'User')
const Token = dbHandler.makeModel('token.server.model', 'Token')

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
  let testAgency

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
    testAgency = collections.agency
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
        expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
        done()
        return res
      })
      Controller.authenticateUser(req, res, () => {})
    })
  })

  describe('validateDomain', () => {
    const expectErrorCode = (email, code, done) => {
      req.body = { email }
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(code)
        done()
        return res
      })
      Controller.validateDomain(req, res)
    }

    let invalidEmails = [
      'falal@@al.gov.sg',
      'falalalsov.sg',
      'a@tech.gov.sg@,b@gmail.com',
      'a@tech.gov.sg,b@gmail.com',
      'b@gmail.com@,a@tech.gov.sg',
    ]

    for (let email of invalidEmails) {
      it(`should return 401 when email is ${email}`, (done) => {
        expectErrorCode(email, 401, done)
      })
    }
    it('should return 401 if email domain is not found', (done) => {
      expectErrorCode('falal@al.gov.sg', 401, done)
    })
    it('should pass on to the next middleware if email domain is valid', (done) => {
      const email = 'falal@test.gov.sg'
      req.body = { email }
      let next = jasmine.createSpy()
      Controller.validateDomain(req, res, next)
      next.and.callFake(() => {
        expect(res.locals.email).toEqual(email)
        expect(res.locals.agency._id).toEqual(testAgency._id)
        expect(next).toHaveBeenCalled()
        done()
      })
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
        expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
        return res
      })
      // Populate admin with partial user object
      let testFormObj = testForm.toObject()
      testFormObj.admin = { id: mongoose.Types.ObjectId('000000000002') }
      req.form = testFormObj
      Controller.verifyPermission(permissionLevels.WRITE)(req, res, () => {})
    })
  })

  describe('createOtp', () => {
    it('should store token in db and pass on to next middleware if agency exists', (done) => {
      const email = 'test@test.gov.sg'
      res.locals = { email }
      let next = jasmine.createSpy()
      let fakeHash = '2131290312983213'
      bcrypt.hash.and.callFake((otp, numRounds, callback) => {
        callback(null, fakeHash)
        expect(bcrypt.hash).toHaveBeenCalled()
      })
      let expectedRecord = {
        email,
        hashedOtp: fakeHash,
        numOtpAttempts: 0,
        expireAt: Date.now() + 15 * 60 * 1000,
      }
      next.and.callFake(() => {
        Token.findOne({ email }, (err, token) => {
          expect(err).not.toBeTruthy()
          expect(token.email).toEqual(expectedRecord.email)
          expect(token.hashedOtp).toEqual(expectedRecord.hashedOtp)
          expect(token.numOtpAttempts).toEqual(expectedRecord.numOtpAttempts)
          // Precise to the last 4 digits
          expect(token.expireAt.getTime()).toBeCloseTo(
            expectedRecord.expireAt,
            -4,
          )
          expect(res.locals.otp).toEqual(TEST_OTP)
          expect(res.locals.expireAt.getTime()).toEqual(
            token.expireAt.getTime(),
          )
          done()
        })
      })
      Controller.createOtp(req, res, next)
    })

    it('should reset numOtpAttempts if token exists for email', (done) => {
      res.locals = { email: req.session.user.email }

      let testToken = new Token({
        email: req.session.user.email,
        hashedOtp: '12938710928312038109',
        expireAt: Date.now(),
        numOtpAttempts: 3,
      })

      bcrypt.hash.and.callFake((otp, numRounds, callback) => {
        callback(null, '129830128310283018')
        expect(bcrypt.hash).toHaveBeenCalled()
      })

      let next = jasmine.createSpy().and.callFake(() => {
        Token.findOne({ email: req.session.user.email }, (err, token) => {
          if (err || !token) {
            done(err || new Error('Token not found'))
          } else {
            expect(token.numOtpAttempts).toEqual(0)
            done()
          }
        })
      })
      testToken.save().then(() => {
        Controller.createOtp(req, res, next)
      })
    })
  })

  describe('sendOtp', () => {
    it('should send email and return a 200', (done) => {
      res.app = {
        locals: { title: 'AppTitle' },
      }
      res.locals = {
        otp: TEST_OTP,
        expireAt: Date.now(),
        email: req.session.user.email,
      }
      res.render = jasmine.createSpy().and.callFake((arg1, arg2, callback) => {
        callback(null, '<html>')
      })
      res.status.and.callFake(() => {
        done()
        return res
      })
      //  Mock the callback with no errors
      mockSendNodeMail.and.callFake((_mail, cb) => {
        cb()
      })
      Controller.sendOtp(req, res)
    })
  })

  describe('verifyOtp', () => {
    // Legit hash for "123456"
    let testHash =
      '$2b$10$wPte/.r1R9xa6Xm0WMKdC.JGeH2ajHHziDH1txi7hKMzgqr8CabcC'
    it('should return 422 if OTP has expired/ does not exist', (done) => {
      res.locals.email = req.session.user.email
      req.body.otp = TEST_OTP
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY)
        done()
        return res
      })
      Controller.verifyOtp(req, res, () => {})
    })

    it('should return 422 if max attempts reached', (done) => {
      res.locals.email = req.session.user.email
      req.body.otp = TEST_OTP
      let testToken = new Token({
        email: req.session.user.email,
        hashedOtp: testHash,
        expireAt: 0,
        numOtpAttempts: 10,
      })
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY)
        done()
        return res
      })
      testToken.save().then(() => {
        Controller.verifyOtp(req, res, () => {})
      })
    })

    it('should return 401 if otp is wrong', (done) => {
      res.locals.email = req.session.user.email
      req.body.otp = '000000'
      let testToken = new Token({
        email: req.session.user.email,
        hashedOtp: testHash,
        expireAt: 0,
        numOtpAttempts: 0,
      })
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
        done()
        return res
      })
      testToken.save().then(() => {
        Controller.verifyOtp(req, res, () => {})
      })
    })

    it('should return 200 and token removed from db if otp is correct', (done) => {
      res.locals.email = req.session.user.email
      req.body.otp = TEST_OTP
      let testToken = new Token({
        email: req.session.user.email,
        hashedOtp: testHash,
        expireAt: 0,
        numOtpAttempts: 0,
      })
      let next = jasmine.createSpy().and.callFake(() => {
        expect(next).toHaveBeenCalled()
        Token.findOne({ email: req.body.email }, (err, tokenFound) => {
          expect(err).not.toBeTruthy()
          expect(tokenFound).toBeNull()
          done()
        })
      })
      testToken.save().then(() => {
        Controller.verifyOtp(req, res, next)
      })
    })
  })

  describe('signIn', () => {
    it('should insert user if new valid email', (done) => {
      const email = 'newuser@test.gov.sg'
      res.locals = { email, agency: testAgency }
      res.status.and.callFake(() => {
        return res
      })
      res.send.and.callFake((args) => {
        expect(args.email).toEqual(email)
        expect(args.agency.toObject()).toEqual(testAgency.toObject())
        expect(req.session.user).toEqual(args)
        User.findOne({ email }, (err, user) => {
          if (err || !user) {
            done(err || new Error('User not found'))
          } else {
            let userObj = user.toObject()
            expect(userObj.agency).toEqual(testAgency._id)
            expect(userObj.created.getTime()).toBeCloseTo(Date.now(), -4)
            done()
          }
        })
      })
      Controller.signIn(req, res)
    })
  })

  describe('signOut', () => {
    it('should clear cookie connect.sid on sign out', (done) => {
      req.session.destroy = jasmine.createSpy().and.callFake((cb) => {
        expect(req.session.destroy).toHaveBeenCalled()
        // Mock callback with no errors
        cb()
        expect(res.clearCookie).toHaveBeenCalledWith('connect.sid')
        done()
      })
      res.clearCookie = jasmine.createSpy()
      res.status.and.callFake(() => {
        return res
      })
      Controller.signOut(req, res)
    })
  })

  describe('doesUserBeta', () => {
    const mockBetaFlag = 'fakeBetaFlag'
    it('should return 200 when user is beta for a given betaType', (done) => {
      req.session.user.betaFlags = {
        [mockBetaFlag]: true,
      }
      let next = jasmine.createSpy().and.callFake(() => {
        expect(next).toHaveBeenCalled()
        done()
      })
      Controller.doesUserBeta(mockBetaFlag)(req, res, next)
    })

    it('should return 403 when user is not beta for a given betaType', (done) => {
      req.session.user.betaFlags = {
        [mockBetaFlag]: false,
      }
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
        done()
        return res
      })
      Controller.doesUserBeta(mockBetaFlag)(req, res, () => {})
    })

    it('should return 403 when user is undefined', (done) => {
      req.session.user = undefined
      res.status.and.callFake(() => {
        expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
        done()
        return res
      })
      Controller.doesUserBeta(mockBetaFlag)(req, res, () => {})
    })
  })
})
