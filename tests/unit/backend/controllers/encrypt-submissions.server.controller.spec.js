const HttpStatus = require('http-status-codes')
const mongoose = require('mongoose')
const express = require('express')
const request = require('supertest')

const dbHandler = require('../helpers/db-handler')

const User = dbHandler.makeModel('user.server.model', 'User')
const Agency = dbHandler.makeModel('agency.server.model', 'Agency')
const Form = dbHandler.makeModel('form.server.model', 'Form')
const EncryptForm = mongoose.model('encrypt')

describe('Encrypt Submissions Controller', () => {
  // Declare global variables
  // spec out controller such that calls to request are
  // directed through a callback to the request spy,
  // which will be destroyed and re-created for every test
  const Controller = spec(
    'dist/backend/app/controllers/encrypt-submissions.server.controller',
    {
      mongoose: Object.assign(mongoose, { '@noCallThru': true }),
    },
  )
  const SpcpController = spec(
    'dist/backend/app/controllers/spcp.server.controller',
    {
      mongoose: Object.assign(mongoose, { '@noCallThru': true }),
      '../../config/ndi-config': {},
    },
  )

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('/save-submission', () => {
    describe('saveMetadataToDb', () => {
      let testForm
      let testAgency
      let testUser
      let testEncryptVersion = 234
      let testReqBody = { version: testEncryptVersion }
      let formData = ''
      const app = express()
      const endpointPath = '/save-submission'

      const originalConsoleError = console.error

      beforeAll(() => {
        // Stubbing console error to prevent appearing in stdout
        console.error = jasmine.createSpy()

        app.route(endpointPath).get(
          (req, res, next) => {
            req.form = testForm
            req.formData = formData
            req.body = testReqBody
            return next()
          },
          Controller.saveResponseToDb,
          (req, res) => res.status(200).send(req.submission),
        )
      })

      beforeEach((done) => {
        testAgency = new Agency({
          shortName: 'test',
          fullName: 'Test Agency',
          emailDomain: 'test.gov.sg',
          logo: 'test.png',
        })
        testAgency
          .save()
          .then(() => {
            testUser = new User({
              email: 'user@test.gov.sg',
              agency: testAgency._id,
            })
            return testUser.save()
          })
          .then(() => {
            testForm = new EncryptForm({
              title: 'Test Form',
              emails: 'test@test.gov.sg',
              admin: testUser._id,
              publicKey: 'publicKey',
            })
            return testForm.save()
          })
          .then(() => done())
      })

      afterAll(() => {
        console.error = originalConsoleError
      })

      it('saves encrypted responses to db', (done) => {
        formData = 'encryptedContent'
        request(app)
          .get(endpointPath)
          .expect(HttpStatus.OK)
          .then(({ body: submission }) => {
            expect(submission.form).toEqual(testForm._id.toString())
            expect(submission.authType).toEqual('NIL')
            expect(submission.myInfoFields).toEqual([])
            expect(submission.encryptedContent).toEqual(formData)
            expect(submission.version).toEqual(testEncryptVersion)
          })
          .then(done)
          .catch(done)
      })
    })
  })

  describe('v2/submissions/encrypt', () => {
    const formsg = require('@opengovsg/formsg-sdk')({ mode: 'test' })
    const {
      checkIsEncryptedEncoding,
    } = require('../../../../dist/backend/app/utils/encryption')

    const publicKey = 'gsyeH+Kl+daaV/GlPzn47tdw2BVeqnh9nhIxNXaKM2I='
    const responses = 'responses'
    const correctlyEncryptedContent = formsg.crypto.encrypt(
      responses,
      publicKey,
    )
    const wronglyEncryptedContent = 'abc'

    const endpointPath = '/v2/submissions/encrypt'

    let fixtures

    const injectFixtures = (req, res, next) => {
      Object.assign(req, fixtures)
      next()
    }

    const sendSubmissionBack = (req, res) => {
      res.status(200).send({
        body: req.body,
      })
    }

    describe('validateEncryptSubmission', () => {
      const app = express()

      beforeAll(() => {
        app
          .route(endpointPath)
          .post(
            injectFixtures,
            Controller.validateEncryptSubmission,
            sendSubmissionBack,
          )
      })

      it('parses submissions', (done) => {
        fixtures = {
          form: new Form({
            title: 'Test Form',
            authType: 'NIL',
            responseMode: 'encrypt',
            publicKey: publicKey,
            form_fields: [],
          }).toObject(),
          body: {
            encryptedContent: correctlyEncryptedContent,
            responses: [],
          },
        }

        request(app)
          .post(endpointPath)
          .expect(HttpStatus.OK)
          .expect(
            JSON.stringify({
              body: {
                encryptedContent: correctlyEncryptedContent,
                parsedResponses: [],
              },
            }),
          )
          .end(done)
      })

      it('Throws 400 for incorrectly encrypted content', (done) => {
        fixtures = {
          body: {
            responses: [],
            encryptedContent: wronglyEncryptedContent,
          },
          form: new Form({
            title: 'Test Form',
            authType: 'NIL',
            responseMode: 'encrypt',
            publicKey: publicKey,
            form_fields: [],
          }).toObject(),
        }
        request(app).post(endpointPath).expect(HttpStatus.BAD_REQUEST).end(done)
      })
    })

    describe('prepareEncryptSubmission', () => {
      let fixtures

      const endpointPath = '/v2/submissions/encrypt'
      const injectFixtures = (req, res, next) => {
        Object.assign(req, fixtures.req)
        Object.assign(res, fixtures.res)
        next()
      }
      const sendSubmissionBack = (req, res) => {
        const submissionData = {
          body: req.body,
          formData: req.formData,
          verified: res.locals.verified,
        }

        // If does not exist, remove entirely from submissionData.
        if (!res.locals.verified) delete submissionData.verified

        res.status(200).send(submissionData)
      }

      const app = express()
      const secretSigningKey = process.env.SIGNING_SECRET_KEY

      beforeAll(() => {
        app
          .route(endpointPath)
          .post(
            injectFixtures,
            SpcpController.encryptedVerifiedFields(secretSigningKey),
            Controller.prepareEncryptSubmission,
            sendSubmissionBack,
          )
      })

      it('Verifies correctly encrypted content without verified content', (done) => {
        fixtures = {
          req: {
            body: {
              encryptedContent: correctlyEncryptedContent,
            },
          },
        }
        request(app)
          .post(endpointPath)
          .expect(HttpStatus.OK)
          .expect(
            JSON.stringify({
              body: { encryptedContent: correctlyEncryptedContent },
              formData: correctlyEncryptedContent,
            }),
          )
          .end(done)
      })

      it('should sign and encrypt local uinFin in SP forms when it exists', (done) => {
        fixtures = {
          req: {
            body: {
              encryptedContent: correctlyEncryptedContent,
            },
            form: new Form({
              title: 'Test Form',
              authType: 'SP',
              responseMode: 'encrypt',
              publicKey: publicKey,
              form_fields: [],
            }).toObject(),
          },
          res: {
            locals: {
              uinFin: 'SXXXXXXYZ',
            },
          },
        }

        request(app)
          .post(endpointPath)
          .expect(HttpStatus.OK)
          .end((err, res) => {
            if (err) return done(err)
            expect(res.body.body).toEqual({
              encryptedContent: correctlyEncryptedContent,
            })
            expect(res.body.formData).toEqual(correctlyEncryptedContent)
            // Cannot get the exact verified string since it changes everytime.
            // Just be content that a string of the correct encoding was
            // returned
            expect(checkIsEncryptedEncoding(res.body.verified)).toBe(true)
            return done()
          })
      })

      it('should sign and encrypt CP data in CP forms when it exists', (done) => {
        fixtures = {
          req: {
            body: {
              encryptedContent: correctlyEncryptedContent,
            },
            form: new Form({
              title: 'Test Form',
              authType: 'CP',
              responseMode: 'encrypt',
              publicKey: publicKey,
              form_fields: [],
            }).toObject(),
          },
          res: {
            locals: {
              uinFin: 'ABCDEFG',
              userData: 'SXXXXXXYZ',
            },
          },
        }

        request(app)
          .post(endpointPath)
          .expect(HttpStatus.OK)
          .end((err, res) => {
            if (err) return done(err)
            expect(res.body.body).toEqual({
              encryptedContent: correctlyEncryptedContent,
            })
            expect(res.body.formData).toEqual(correctlyEncryptedContent)
            // Cannot get the exact verified string since it changes everytime.
            // Just be content that a string of the correct encoding was
            // returned
            expect(checkIsEncryptedEncoding(res.body.verified)).toBe(true)
            return done()
          })
      })
    })
  })
})
