const HttpStatus = require('http-status-codes')
const { hash } = require('bcrypt')
const mongoose = require('mongoose')

const constants = require('../../../../../dist/backend/shared/util/verification')
const dbHandler = require('../../helpers/db-handler')
const MailService = require('../../../../../dist/backend/app/services/mail.service')
  .default

const User = dbHandler.makeModel('user.server.model', 'User')
const Agency = dbHandler.makeModel('agency.server.model', 'Agency')
const Form = dbHandler.makeModel('form.server.model', 'Form')
const Verification = dbHandler.makeModel(
  'verification.server.model',
  'Verification',
)

describe('Verification Controller', () => {
  const bcrypt = jasmine.createSpyObj('bcrypt', ['hash'])
  const sendSmsOtp = jasmine.createSpy('sendSmsOtp')
  const testOtp = '123456'

  let sendOtpSpy
  let req
  let res

  const service = spec(
    'dist/backend/app/modules/verification/verification.service',
    {
      mongoose: Object.assign(mongoose, { '@noCallThru': true }),
      bcrypt,
      '../../../config/config': {
        otpGenerator: () => testOtp,
        logger: console,
      },
      '../../factories/sms.factory': {
        sendVerificationOtp: sendSmsOtp,
      },
    },
  )
  const controller = spec(
    'dist/backend/app/modules/verification/verification.controller',
    {
      './verification.service': service,
    },
  )
  let testAgency, testUser, testForm

  beforeAll(async (done) => {
    await dbHandler.connect()

    sendOtpSpy = spyOn(MailService, 'sendVerificationOtp')

    await Agency.deleteMany({})
    testAgency = new Agency({
      shortName: 'govtest',
      fullName: 'Government Testing Agency',
      emailDomain: 'test.gov.sg',
      logo: '/invalid-path/test.jpg',
    })
    testAgency
      .save()
      .then(() => {
        return User.deleteMany({})
      })
      .then(() => {
        testUser = new User({
          email: 'test@test.gov.sg',
          agency: testAgency._id,
        })
        return testUser.save()
      })
      .then(done)
  })
  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      session: {},
      headers: {},
      ip: '127.0.0.1',
    }

    res = jasmine.createSpyObj('res', ['status', 'send', 'json', 'sendStatus'])
    res.locals = {}
  })

  afterAll(async () => await dbHandler.closeDatabase())

  const expectStatus = function (expectedStatus) {
    return function (status) {
      expect(status).toEqual(expectedStatus)
      return this
    }
  }

  const createTransactionForForm = (form) => {
    return (expireAt, verifiableFields) => {
      let t = {
        formId: String(form._id),
        expireAt,
      }
      t.fields = verifiableFields.map((field, i) => {
        const {
          fieldType,
          hashCreatedAt,
          hashedOtp,
          signedData,
          hashRetries,
        } = field
        return {
          _id: form.form_fields[i]._id,
          fieldType,
          hashCreatedAt: hashCreatedAt === undefined ? null : hashCreatedAt,
          hashedOtp: hashedOtp === undefined ? null : hashedOtp,
          signedData: signedData === undefined ? null : signedData,
          hashRetries: hashRetries === undefined ? 0 : hashRetries,
        }
      })
      return Verification.create(t)
    }
  }

  const expireAt = new Date()
  expireAt.setTime(
    expireAt.getTime() + constants.TRANSACTION_EXPIRE_AFTER_SECONDS * 1000,
  ) // Expires 4 hours later
  const hasExpired = new Date()
  hasExpired.setTime(
    hasExpired.getTime() - constants.TRANSACTION_EXPIRE_AFTER_SECONDS * 2000,
  ) // Expired 2 days ago

  describe('No verified fields in form', () => {
    beforeEach((done) => {
      testForm = new Form({
        title: 'Test Form',
        emails: 'test@test.gov.sg',
        admin: testUser._id,
        form_fields: [{ fieldType: 'email' }, { fieldType: 'mobile' }], // Not verifiable
      })
      testForm.save({ validateBeforeSave: false }).then(done)
    })

    it('should not create a transaction for forms that do not contain any fields that have to be verified', (done) => {
      const spyOnCreate = spyOn(Verification, 'create').and.callThrough()
      req.body.formId = testForm._id
      res.sendStatus.and.callFake((status) => {
        expect(status).toEqual(HttpStatus.OK)
        expect(spyOnCreate).not.toHaveBeenCalled()
        done()
      })

      controller.createTransaction(req, res)
    })
  })

  describe('Verified fields', () => {
    let createTransaction
    beforeAll((done) => {
      testForm = new Form({
        title: 'Test Form',
        emails: 'test@test.gov.sg',
        admin: testUser._id,
        form_fields: [
          { fieldType: 'email', isVerifiable: true },
          { fieldType: 'mobile', isVerifiable: true },
        ], // Verifiable
      })
      testForm
        .save({ validateBeforeSave: false })
        .then(() => {
          createTransaction = createTransactionForForm(testForm)
        })
        .then(done)
    })

    it('should create a transaction for forms that contain fields that have to be verified', (done) => {
      req.body.formId = testForm._id
      res.status.and.callFake(expectStatus(HttpStatus.CREATED))
      res.json.and.callFake(function (json) {
        Verification.findById(json.transactionId, function (err, result) {
          // eslint-disable-next-line no-console
          if (err) console.error(err)
          expect(json.transactionId).toEqual(result._id)
          expect(json.expireAt).toEqual(result.expireAt)
          const testFields = testForm.form_fields.filter((f) => f.isVerifiable)
          expect(testFields.length).toEqual(result.fields.length)
          testFields.forEach((field, i) => {
            expect(result.fields[i]._id).toEqual(String(field._id))
            expect(result.fields[i].fieldType).toEqual(field.fieldType)
          })
          done()
        })
        return this
      })
      controller.createTransaction(req, res)
    })

    it('should get transaction', (done) => {
      createTransaction(expireAt, [
        { fieldType: 'email' },
        { fieldType: 'mobile' },
      ]).then((transaction) => {
        req.params.transactionId = transaction.id
        res.status.and.callFake(expectStatus(HttpStatus.OK))
        res.json.and.callFake(function (json) {
          expect(json.fields).toEqual(undefined) // fields should not be returned in metadata
          Verification.findById(json._id, function (err, result) {
            // eslint-disable-next-line no-console
            if (err) console.error(err)
            expect(json._id).toEqual(result._id)
            expect(json.formId).toEqual(result.formId)
            expect(json.expireAt).toEqual(result.expireAt)
            const testFields = testForm.form_fields.filter(
              (f) => f.isVerifiable,
            )
            expect(testFields.length).toEqual(result.fields.length)
            testFields.forEach((field, i) => {
              expect(result.fields[i]._id).toEqual(String(field._id))
              expect(result.fields[i].fieldType).toEqual(field.fieldType)
              expect(result.fields[i].hashCreatedAt).toEqual(null)
              expect(result.fields[i].hashedOtp).toEqual(null)
              expect(result.fields[i].signedData).toEqual(null)
            })

            done()
          })
        })
        controller.getTransactionMetadata(req, res)
      })
    })

    it('should create an otp for the email field to be verified and send it out', (done) => {
      const hashValue = 'hashValue'
      bcrypt.hash.and.returnValue('hashValue')

      createTransaction(expireAt, [
        { fieldType: 'email' },
        { fieldType: 'mobile' },
      ]).then((transaction) => {
        req.params.transactionId = transaction.id
        req.body = {
          fieldId: String(testForm.form_fields[0]._id),
          answer: 'test@abc.com',
        }
        res.sendStatus.and.callFake(function (status) {
          expect(status).toEqual(HttpStatus.CREATED)
          expect(sendOtpSpy).toHaveBeenCalled()
          Verification.findById(transaction._id, function (err, result) {
            // eslint-disable-next-line no-console
            if (err) console.error(err)
            const transactionField = result.fields[0]
            const testField = testForm.form_fields[0]
            expect(transactionField._id).toEqual(String(testField._id))
            expect(transactionField.fieldType).toEqual(testField.fieldType)
            // The hashes should have been created
            expect(transactionField.hashCreatedAt instanceof Date).toEqual(true)
            expect(transactionField.hashedOtp).toEqual(hashValue)
            expect(transactionField.signedData).not.toEqual(null)
            done()
          })
          return this
        })
        controller.getNewOtp(req, res)
      })
    })

    it('should create an otp for the mobile sms field to be verified and send it out', (done) => {
      const hashValue = 'hashValue'
      bcrypt.hash.and.returnValue('hashValue')
      createTransaction(expireAt, [
        { fieldType: 'email' },
        { fieldType: 'mobile' },
      ]).then((transaction) => {
        req.params.transactionId = transaction.id
        req.body = {
          fieldId: String(testForm.form_fields[1]._id),
          answer: '+6583334444',
        }
        res.sendStatus.and.callFake(function (status) {
          expect(status).toEqual(HttpStatus.CREATED)
          expect(sendSmsOtp).toHaveBeenCalled()
          Verification.findById(transaction._id, function (err, result) {
            // eslint-disable-next-line no-console
            if (err) console.error(err)
            const transactionField = result.fields[1]
            const testField = testForm.form_fields[1]
            expect(transactionField._id).toEqual(String(testField._id))
            expect(transactionField.fieldType).toEqual(testField.fieldType)
            // The hashes should have been created
            expect(transactionField.hashCreatedAt instanceof Date).toEqual(true)
            expect(transactionField.hashedOtp).toEqual(hashValue)
            expect(transactionField.signedData).not.toEqual(null)
            done()
          })
          return this
        })
        controller.getNewOtp(req, res)
      })
    })

    it('should limit the rate of otp requests', (done) => {
      const hashCreatedAt = new Date()
      const hashedOtp = 'someHash'
      const signedData = 'someData'

      createTransaction(expireAt, [
        {
          fieldType: 'email',
          hashCreatedAt,
          hashedOtp,
          signedData,
        },
      ]).then((transaction) => {
        req.params.transactionId = transaction.id
        req.body = {
          fieldId: String(testForm.form_fields[0]._id),
          answer: 'test@abc.com',
        }
        // WAIT_FOR_OTP
        res.status.and.callFake(expectStatus(HttpStatus.ACCEPTED))
        res.json.and.callFake(function () {
          Verification.findById(transaction._id, function (err, result) {
            // eslint-disable-next-line no-console
            if (err) console.error(err)
            const transactionField = result.fields[0]
            const testField = testForm.form_fields[0]
            expect(transactionField._id).toEqual(String(testField._id))
            expect(transactionField.fieldType).toEqual(testField.fieldType)
            // The hashes should remain the same, no change because a new otp was not created
            expect(transactionField.hashCreatedAt).toEqual(hashCreatedAt)
            expect(transactionField.hashedOtp).toEqual(hashedOtp)
            expect(transactionField.signedData).toEqual(signedData)
            done()
          })
        })
        controller.getNewOtp(req, res)
      })
    })

    it('should return an error if transaction has expired when getting otp', (done) => {
      createTransaction(hasExpired, [
        {
          fieldType: 'email',
          hashCreatedAt: null,
          hashedOtp: null,
          signedData: null,
        },
      ]).then((transaction) => {
        req.params.transactionId = transaction.id
        req.body = {
          fieldId: String(testForm.form_fields[0]._id),
          answer: 'test@abc.com',
        }
        // TRANSACTION_NOT_FOUND
        res.status.and.callFake(expectStatus(HttpStatus.NOT_FOUND))
        res.json.and.callFake(function () {
          done()
        })
        controller.getNewOtp(req, res)
      })
    })
    it('should return an error if transaction has expired when verifying otp', (done) => {
      createTransaction(hasExpired, [
        {
          fieldType: 'email',
          hashCreatedAt: null,
          hashedOtp: null,
          signedData: null,
        },
      ]).then((transaction) => {
        req.params.transactionId = transaction.id
        req.body = {
          fieldId: String(testForm.form_fields[0]._id),
          otp: '000000',
        }
        // TRANSACTION_NOT_FOUND
        res.status.and.callFake(expectStatus(HttpStatus.NOT_FOUND))
        res.json.and.callFake(function () {
          done()
        })
        controller.verifyOtp(req, res)
      })
    })
    it('should return an error if hash has expired when verifying otp', (done) => {
      createTransaction(expireAt, [
        {
          fieldType: 'email',
          hashCreatedAt: hasExpired,
          hashedOtp: 'someHashValue',
          signedData: 'someData',
        },
      ]).then((transaction) => {
        req.params.transactionId = transaction.id
        req.body = {
          fieldId: String(testForm.form_fields[0]._id),
          otp: '000000',
        }
        // RESEND_OTP
        res.status.and.callFake(expectStatus(HttpStatus.UNPROCESSABLE_ENTITY))
        res.json.and.callFake(function () {
          done()
        })
        controller.verifyOtp(req, res)
      })
    })

    it('should limit the rate of otp retries', (done) => {
      const hashCreatedAt = new Date()
      const hashedOtp = 'someHashValue'
      const signedData = 'someData'
      createTransaction(expireAt, [
        {
          fieldType: 'email',
          hashCreatedAt,
          hashedOtp,
          signedData,
          hashRetries: 4,
        },
      ]).then((transaction) => {
        req.params.transactionId = transaction.id
        req.body = {
          fieldId: String(testForm.form_fields[0]._id),
          otp: '000000',
        }
        res.status.and.callFake(expectStatus(HttpStatus.UNPROCESSABLE_ENTITY))
        res.json.and.callFake(function (json) {
          expect(json).toEqual('RESEND_OTP')
          done()
        })
        controller.verifyOtp(req, res)
      })
    })

    it('should return an error if otp is incorrect when verifying otp', (done) => {
      const hashCreatedAt = new Date()
      hashCreatedAt.setTime(
        expireAt.getTime() - constants.TRANSACTION_EXPIRE_AFTER_SECONDS * 500,
      )
      hash(testOtp, 10, function (err, hashedOtp) {
        // eslint-disable-next-line no-console
        if (err) console.error(err)

        createTransaction(expireAt, [
          {
            fieldType: 'email',
            hashCreatedAt,
            hashedOtp,
            signedData: 'someData',
          },
        ]).then((transaction) => {
          req.params.transactionId = transaction.id
          req.body = {
            fieldId: String(testForm.form_fields[0]._id),
            otp: '000000',
          }
          // INVALID_OTP
          res.status.and.callFake(expectStatus(HttpStatus.UNPROCESSABLE_ENTITY))
          res.json.and.callFake(function () {
            done()
          })
          controller.verifyOtp(req, res)
        })
      })
    })

    it('should return signed data if otp is correct when verifying otp', (done) => {
      const hashCreatedAt = new Date()
      hashCreatedAt.setTime(
        expireAt.getTime() - constants.TRANSACTION_EXPIRE_AFTER_SECONDS * 500,
      )
      const signedData = 'someData'
      hash(testOtp, 10, function (err, hashedOtp) {
        // eslint-disable-next-line no-console
        if (err) console.error(err)
        createTransaction(expireAt, [
          {
            fieldType: 'email',
            hashCreatedAt,
            hashedOtp,
            signedData,
          },
        ]).then((transaction) => {
          req.params.transactionId = transaction.id
          req.body = {
            fieldId: String(testForm.form_fields[0]._id),
            otp: testOtp,
          }
          res.status.and.callFake(expectStatus(HttpStatus.OK))
          res.json.and.callFake(function (json) {
            expect(json).toEqual(signedData)
            done()
          })
          controller.verifyOtp(req, res)
        })
      })
    })

    it("should reset the otp if field's value has changed", (done) => {
      createTransaction(expireAt, [
        {
          fieldType: 'email',
          hashCreatedAt: new Date(),
          hashedOtp: 'someHashValue',
          signedData: 'someData',
        },
      ]).then((transaction) => {
        req.params.transactionId = transaction.id
        req.body = {
          fieldId: String(testForm.form_fields[0]._id),
        }
        res.sendStatus.and.callFake(function (status) {
          expect(status).toEqual(HttpStatus.OK)
          Verification.findById(transaction._id, function (err, result) {
            // eslint-disable-next-line no-console
            if (err) console.error(err)
            const transactionField = result.fields[0]
            const testField = testForm.form_fields[0]
            expect(transactionField._id).toEqual(String(testField._id))
            expect(transactionField.fieldType).toEqual(testField.fieldType)
            // The hashes should have been reset back to null
            expect(transactionField.hashCreatedAt).toEqual(null)
            expect(transactionField.hashedOtp).toEqual(null)
            expect(transactionField.signedData).toEqual(null)
            done()
          })
        })
        controller.resetFieldInTransaction(req, res)
      })
    })
  })
})
