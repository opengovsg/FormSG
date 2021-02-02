const { StatusCodes } = require('http-status-codes')
const { times, omit } = require('lodash')
const ejs = require('ejs')
const express = require('express')
const request = require('supertest')
const mongoose = require('mongoose')

const dbHandler = require('../helpers/db-handler')

const { ObjectID } = require('bson-ext')
const MailService = require('../../../../dist/backend/app/services/mail/mail.service')
  .default
const EmailSubmissionsMiddleware = require('../../../../dist/backend/app/modules/submission/email-submission/email-submission.middleware')
const User = dbHandler.makeModel('user.server.model', 'User')
const Agency = dbHandler.makeModel('agency.server.model', 'Agency')
const Form = dbHandler.makeModel('form.server.model', 'Form')
const Verification = dbHandler.makeModel(
  'verification.server.model',
  'Verification',
)
const vfnConstants = require('../../../../dist/backend/shared/util/verification')

describe('Email Submissions Controller', () => {
  // Declare global variables
  let sendSubmissionMailSpy

  // spec out controller such that calls to request are
  // directed through a callback to the request spy,
  // which will be destroyed and re-created for every test
  const spcpController = spec('dist/backend/app/modules/spcp/spcp.controller', {
    mongoose: Object.assign(mongoose, { '@noCallThru': true }),
  })

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('notifyParties', () => {
    const originalConsoleError = console.error

    let fixtures

    const endpointPath = '/send-admin-email'
    const injectFixtures = (req, res, next) => {
      Object.assign(req, fixtures)
      return next()
    }

    const app = express()

    // Set EJS as the template engine
    app.engine('server.view.html', ejs.__express)

    // Set views path and view engine
    app.set('view engine', 'server.view.html')
    app.set('views', './src/app/views')

    beforeAll(() => {
      console.error = jasmine.createSpy()
      app
        .route(endpointPath)
        .get(
          injectFixtures,
          EmailSubmissionsMiddleware.sendAdminEmail,
          (req, res) => res.status(200).send(),
        )

      sendSubmissionMailSpy = spyOn(MailService, 'sendSubmissionToAdmin')
    })

    afterAll(() => {
      console.error = originalConsoleError
    })

    afterEach(() => sendSubmissionMailSpy.calls.reset())

    beforeEach(() => {
      fixtures = {
        body: {
          parsedResponses: [],
        },
        replyToEmails: [],
        attachments: [
          {
            filename: 'file.txt',
            content: Buffer.alloc(5),
          },
        ],
        form: {
          title: 'Form Title',
          emails: ['test@test.gov.sg'],
          responseMode: 'email',
        },
        formData: [
          {
            question: 'foo',
            answerTemplate: ['bar'],
          },
        ],
        submission: {
          id: 1,
          created: Date.now(),
        },
        jsonData: [
          {
            question: 'Reference Number',
            answer: '123',
          },
          {
            question: 'Timestamp',
            answer: '1/2/3',
          },
          {
            question: 'foo',
            answer: 'bar',
          },
        ],
      }
    })

    it('sends mail with correct parameters', (done) => {
      // Arrange
      sendSubmissionMailSpy.and.callFake(() => Promise.resolve(true))

      request(app)
        .get(endpointPath)
        .expect(StatusCodes.OK)
        .then(() => {
          const mailOptions = sendSubmissionMailSpy.calls.mostRecent().args[0]
          expect(mailOptions).toEqual(omit(fixtures, 'body'))
        })
        .then(done)
        .catch(done)
    })

    it('errors with 400 on send failure', (done) => {
      // Arrange
      sendSubmissionMailSpy.and.callFake(() =>
        Promise.reject(new Error('mockErrorResponse')),
      )
      // Trigger error by deleting recipient list
      delete fixtures.form.emails
      request(app)
        .get(endpointPath)
        .expect(StatusCodes.BAD_REQUEST)
        .then(done)
        .catch(done)
    })
  })

  describe('receiveEmailSubmissionUsingBusBoy', () => {
    const endpointPath = '/v2/submissions/email'
    const sendSubmissionBack = (req, res) => {
      res.status(200).send({
        body: req.body,
      })
    }

    const app = express()

    const injectForm = (req, res, next) => {
      Object.assign(req, { form: { _id: 'formId' } })
      next()
    }

    beforeAll(() => {
      app
        .route(endpointPath)
        .post(
          injectForm,
          EmailSubmissionsMiddleware.receiveEmailSubmission,
          sendSubmissionBack,
        )
    })

    it('parses submissions without files', (done) => {
      const body = { responses: [] }
      request(app)
        .post(endpointPath)
        .field('body', JSON.stringify(body))
        .expect(StatusCodes.OK)
        .expect({ body })
        .end(done)
    })

    it('parses submissions with files', (done) => {
      const body = {
        responses: [
          {
            _id: 'receiveId',
            question: 'attachment question',
            fieldType: 'attachment',
            answer: 'govtech.jpg',
          },
        ],
      }

      const parsedBody = {
        responses: [
          {
            _id: 'receiveId',
            question: 'attachment question',
            fieldType: 'attachment',
            answer: 'govtech.jpg',
            filename: 'govtech.jpg',
            content: Buffer.alloc(1),
          },
        ],
      }
      request(app)
        .post(endpointPath)
        .field('body', JSON.stringify(body))
        .attach('govtech.jpg', Buffer.alloc(1), 'receiveId')
        .expect(StatusCodes.OK)
        .expect(JSON.stringify({ body: parsedBody }))
        .end(done)
    })

    it('changes duplicated file names', (done) => {
      const body = {
        responses: [
          {
            _id: 'attachment1',
            question: 'question 1',
            fieldType: 'attachment',
            answer: 'attachment.jpg',
          },
          {
            _id: 'attachment2',
            question: 'question 2',
            fieldType: 'attachment',
            answer: 'attachment.jpg',
          },
        ],
      }
      const parsedBody = {
        responses: [
          {
            _id: 'attachment1',
            question: 'question 1',
            fieldType: 'attachment',
            answer: '1-attachment.jpg',
            filename: '1-attachment.jpg',
            content: Buffer.alloc(1),
          },
          {
            _id: 'attachment2',
            question: 'question 2',
            fieldType: 'attachment',
            answer: 'attachment.jpg',
            filename: 'attachment.jpg',
            content: Buffer.alloc(1),
          },
        ],
      }

      request(app)
        .post(endpointPath)
        .field('body', JSON.stringify(body))
        .attach('attachment.jpg', Buffer.alloc(1), 'attachment1')
        .attach('attachment.jpg', Buffer.alloc(1), 'attachment2')
        .expect(StatusCodes.OK)
        .expect(JSON.stringify({ body: parsedBody }))
        .end(done)
    })
  })

  describe('validateSubmission', () => {
    let fixtures

    beforeEach(() => {
      fixtures = {
        form: new Form({
          title: 'Test Form',
          authType: 'NIL',
          responseMode: 'email',
          form_fields: [],
        }),
        body: {
          responses: [],
        },
      }
    })

    const endpointPath = '/v2/submissions/email'
    const injectFixtures = (req, res, next) => {
      Object.assign(req, fixtures)
      next()
    }
    const sendSubmissionBack = (req, res) => {
      res.status(200).send({
        body: req.body,
        attachments: req.attachments,
      })
    }

    const app = express()

    beforeAll(() => {
      app
        .route(endpointPath)
        .post(
          injectFixtures,
          EmailSubmissionsMiddleware.validateEmailSubmission,
          sendSubmissionBack,
        )
    })

    it('parses submissions without files', (done) => {
      request(app)
        .post(endpointPath)
        .expect(StatusCodes.OK)
        .expect(
          JSON.stringify({
            body: {
              parsedResponses: [],
            },
            attachments: [],
          }),
        )
        .end(done)
    })

    it('parses submissions with attachments', (done) => {
      const requiredAttachmentId = new ObjectID()
      const optionalAttachmentId = new ObjectID()

      const validAttachmentName = 'valid.pdf'

      fixtures.form.form_fields.push({
        title: 'Attachment',
        required: true,
        fieldType: 'attachment',
        _id: requiredAttachmentId,
        attachmentSize: '1',
      })

      fixtures.form.form_fields.push({
        title: 'NotRequired',
        required: false,
        fieldType: 'attachment',
        _id: optionalAttachmentId,
        attachmentSize: '1',
      })

      fixtures.body.responses.push({
        _id: String(requiredAttachmentId),
        fieldType: 'attachment',
        answer: validAttachmentName,
        filename: validAttachmentName,
        content: Buffer.alloc(1),
      })

      fixtures.body.responses.push({
        _id: String(optionalAttachmentId),
        fieldType: 'attachment',
        answer: '',
      })

      const expectedResponses = []

      expectedResponses.push({
        _id: String(requiredAttachmentId),
        fieldType: 'attachment',
        answer: validAttachmentName,
        filename: validAttachmentName,
        content: Buffer.alloc(1),
        isVisible: true,
        question: 'Attachment',
      })

      expectedResponses.push({
        _id: String(optionalAttachmentId),
        fieldType: 'attachment',
        answer: '',
        isVisible: true,
        question: 'NotRequired',
      })

      request(app)
        .post(endpointPath)
        .expect(StatusCodes.OK)
        .expect(
          JSON.stringify({
            body: {
              parsedResponses: expectedResponses,
            },
            attachments: [
              {
                fieldId: String(requiredAttachmentId),
                filename: validAttachmentName,
                content: Buffer.alloc(1),
              },
            ],
          }),
        )
        .end(done)
    })

    it('returns 400 for attachments with invalid file exts', (done) => {
      fixtures.body.responses.push({
        title: 'Attachment',
        required: true,
        fieldType: 'attachment',
        _id: String(new ObjectID()),
        attachmentSize: '1',
        content: Buffer.alloc(1),
        filename: 'invalid.py',
      })
      request(app).post(endpointPath).expect(StatusCodes.BAD_REQUEST).end(done)
    })

    it('returns 400 for attachments beyond 7 million bytes', (done) => {
      fixtures.body.responses.push({
        title: 'Attachment',
        required: true,
        fieldType: 'attachment',
        _id: String(new ObjectID()),
        attachmentSize: '1',
        content: Buffer.alloc(3000000),
        filename: 'valid.jpg',
      })
      fixtures.body.responses.push({
        title: 'Attachment',
        required: true,
        fieldType: 'attachment',
        _id: String(new ObjectID()),
        attachmentSize: '1',
        content: Buffer.alloc(3000000),
        filename: 'valid.jpg',
      })
      fixtures.body.responses.push({
        title: 'Attachment',
        required: true,
        fieldType: 'attachment',
        _id: String(new ObjectID()),
        attachmentSize: '1',
        content: Buffer.alloc(3000000),
        filename: 'valid.jpg',
      })
      request(app).post(endpointPath).expect(StatusCodes.BAD_REQUEST).end(done)
    })
  })

  describe('prepareSubmissionForEmail', () => {
    let reqFixtures
    let resLocalFixtures

    beforeEach(() => {
      reqFixtures = {
        attachments: [],
        form: new Form({
          title: 'Test Form',
          authType: 'NIL',
          responseMode: 'email',
        }),
        body: { form_fields: [], responses: [] },
      }

      resLocalFixtures = {}
    })

    const endpointPath = '/v2/submissions/email'
    const injectFixtures = (req, res, next) => {
      Object.assign(req, reqFixtures)
      if (Object.entries(resLocalFixtures).length !== 0) {
        Object.assign(res, { locals: resLocalFixtures })
      }
      next()
    }
    const sendSubmissionBack = (req, res) => {
      res.status(200).send({
        formData: req.formData,
        autoReplyData: req.autoReplyData,
        jsonData: req.jsonData,
        attachments: req.attachments.map((b) => {
          b.content = b.content.toString('base64')
          return b
        }),
      })
    }

    const app = express()

    beforeAll(() => {
      app
        .route(endpointPath)
        .get(
          injectFixtures,
          EmailSubmissionsMiddleware.validateEmailSubmission,
          spcpController.appendVerifiedSPCPResponses,
          EmailSubmissionsMiddleware.prepareEmailSubmission,
          sendSubmissionBack,
        )
    })

    const prepareSubmissionThenCompare = (expected, done) => {
      request(app)
        .get(endpointPath)
        .expect(StatusCodes.OK)
        .then(({ body: { formData, autoReplyData, jsonData } }) => {
          expect(formData).withContext('Form Data').toEqual(expected.formData)
          expect(autoReplyData)
            .withContext('autoReplyData')
            .toEqual(expected.autoReplyData)
          expect(jsonData).withContext('jsonData').toEqual(expected.jsonData)
        })
        .then(done)
        .catch(done)
    }

    const expectStatusCodeError = (statusCode, done) => {
      request(app).get(endpointPath).expect(statusCode).then(done)
    }
    /**
     * Mock a field
     * @param {String} fieldId
     * @param {String} fieldType
     * @param {String} title
     * @param {Object} options  other options that can be passed to a field in the field schema
     */
    const makeField = (fieldId, fieldType, title, options) => {
      return { _id: new ObjectID(fieldId), fieldType, title, ...options }
    }
    /**
     *  Mock a response
     * @param {String} fieldId field id of the field that this response is meant for
     * @param {String} fieldType field type of the field that this response is meant for
     * @param {String} question
     * @param {String} answer
     * @param {Array} [answerArray] array of answers passed in for checkbox and table
     * @param {Boolean} [isExpectedToBeVisible] this boolean is used for computing expected output, and should match isVisible injected by server to pass the test
     */
    const makeResponse = (
      fieldId,
      fieldType,
      question,
      answer,
      answerArray = null,
      isExpectedToBeVisible = true,
    ) => {
      let response = {
        _id: String(fieldId),
        fieldType,
        question,
        answer,
        isExpectedToBeVisible,
      }
      if (answerArray) response.answerArray = answerArray
      return response
    }

    /**
     * Generate expected output for a table
     * @param {Object} field
     * @param {String} field.title
     * @param {String} field.fieldType
     * @param {Array} field.columns
     * @param {Object} response
     * @param {Array} response.answerArray
     * @param {Boolean} response.isExpectedToBeVisible
     */
    const getExpectedForTable = (field, response) => {
      const { answerArray, isExpectedToBeVisible } = response
      const { columns, title, fieldType } = field
      const columnTitles = columns.map(({ title }) => title)
      const autoReplyQuestion = `${title} (${columnTitles.join(', ')})`
      const question = `[table] ${autoReplyQuestion}`
      let expected = {
        autoReplyData: [],
        formData: [],
        jsonData: [],
      }
      for (let answer of answerArray) {
        answer = String(answer)
        const answerTemplate = answer.split('\n')
        if (isExpectedToBeVisible) {
          // Auto replies only show visible data
          expected.autoReplyData.push({
            question: autoReplyQuestion,
            answerTemplate,
          })
        }
        expected.jsonData.push({
          question,
          answer,
        })
        expected.formData.push({
          question,
          answerTemplate,
          answer,
          fieldType,
        })
      }
      return expected
    }

    /**
     *  Generate expected output
     * @param {Array} fields
     * @param {Array} responses
     * @returns {Object} { autoReplyData: Array, formData: Array, jsonData: Array }
     */
    const getExpectedOutput = (fields, responses) => {
      let expected = {
        autoReplyData: [],
        formData: [],
        jsonData: [],
      }
      for (let i = 0; i < fields.length; i++) {
        const answer = String(responses[i].answer)
        const answerTemplate = answer.split('\n')
        if (fields[i].fieldType === 'table') {
          const expectedTable = getExpectedForTable(fields[i], responses[i])
          expected.autoReplyData.push(...expectedTable.autoReplyData)
          expected.jsonData.push(...expectedTable.jsonData)
          expected.formData.push(...expectedTable.formData)
        } else {
          let question = fields[i].title
          if (responses[i].isExpectedToBeVisible) {
            // Auto replies only show visible data
            expected.autoReplyData.push({
              question,
              answerTemplate,
            })
          }
          if (fields[i].fieldType !== 'section') {
            expected.jsonData.push({
              question,
              answer,
            })
          }
          expected.formData.push({
            question,
            answerTemplate,
            answer,
            fieldType: fields[i].fieldType,
          })
        }
      }
      return expected
    }

    it('maps SingPass attributes', (done) => {
      resLocalFixtures.uinFin = 'S1234567A'
      reqFixtures.form.authType = 'SP'
      const expectedFormData = [
        {
          question: 'SingPass Validated NRIC',
          answerTemplate: [resLocalFixtures.uinFin],
          answer: resLocalFixtures.uinFin,
          fieldType: 'nric',
        },
      ]
      const expectedAutoReplyData = [
        {
          question: 'SingPass Validated NRIC',
          answerTemplate: [resLocalFixtures.uinFin],
        },
      ]
      const expectedJsonData = [
        {
          question: 'SingPass Validated NRIC',
          answer: resLocalFixtures.uinFin,
        },
      ]
      const expected = {
        formData: expectedFormData,
        autoReplyData: expectedAutoReplyData,
        jsonData: expectedJsonData,
      }
      prepareSubmissionThenCompare(expected, done)
    })

    it('maps CorpPass attributes', (done) => {
      resLocalFixtures.uinFin = '123456789K'
      resLocalFixtures.userInfo = 'S1234567A'
      reqFixtures.form.authType = 'CP'
      const expectedFormData = [
        {
          question: 'CorpPass Validated UEN',
          answerTemplate: [resLocalFixtures.uinFin],
          answer: resLocalFixtures.uinFin,
          fieldType: 'textfield',
        },
        {
          question: 'CorpPass Validated UID',
          answerTemplate: [resLocalFixtures.userInfo],
          answer: resLocalFixtures.userInfo,
          fieldType: 'nric',
        },
      ]
      const expectedAutoReplyData = [
        {
          question: 'CorpPass Validated UEN',
          answerTemplate: [resLocalFixtures.uinFin],
        },
        {
          question: 'CorpPass Validated UID',
          answerTemplate: [resLocalFixtures.userInfo],
        },
      ]
      const expectedJsonData = [
        {
          question: 'CorpPass Validated UEN',
          answer: resLocalFixtures.uinFin,
        },
        {
          question: 'CorpPass Validated UID',
          answer: resLocalFixtures.userInfo,
        },
      ]
      const expected = {
        formData: expectedFormData,
        autoReplyData: expectedAutoReplyData,
        jsonData: expectedJsonData,
      }
      prepareSubmissionThenCompare(expected, done)
    })

    it('prefixes MyInfo fields with [MyInfo]', (done) => {
      const fieldId = new ObjectID()

      const attr = 'passportnumber'
      resLocalFixtures.hashedFields = new Set([fieldId.toHexString()])
      const responseField = {
        _id: String(fieldId),
        question: 'myinfo',
        fieldType: 'textfield',
        isHeader: false,
        answer: 'bar',
        myInfo: { attr },
      }
      reqFixtures.body.responses.push(responseField)
      reqFixtures.form.form_fields.push({
        _id: fieldId,
        title: 'myinfo',
        fieldType: 'textfield',
        required: true,
        myInfo: { attr },
      })
      const expectedJsonData = [
        {
          question: 'myinfo',
          answer: 'bar',
        },
      ]
      const expectedFormData = [
        {
          question: '[MyInfo] myinfo',
          answerTemplate: ['bar'],
          answer: 'bar',
          fieldType: 'textfield',
        },
      ]
      const expectedAutoReplyData = [
        {
          question: 'myinfo',
          answerTemplate: ['bar'],
        },
      ]
      const expected = {
        autoReplyData: expectedAutoReplyData,
        jsonData: expectedJsonData,
        formData: expectedFormData,
      }
      prepareSubmissionThenCompare(expected, done)
    })

    it('maps text if isVisible', (done) => {
      const fieldId = new ObjectID()
      reqFixtures.body.responses.push({
        _id: String(fieldId),
        question: 'regular',
        fieldType: 'textfield',
        isHeader: false,
        answer: 'foo',
      })
      reqFixtures.form.form_fields.push({
        _id: fieldId,
        title: 'regular',
        fieldType: 'textfield',
      })
      const expectedAutoReplyData = [
        {
          question: 'regular',
          answerTemplate: ['foo'],
        },
      ]
      const expectedJsonData = [
        {
          question: 'regular',
          answer: 'foo',
        },
      ]
      const expectedFormData = [
        {
          question: 'regular',
          answerTemplate: ['foo'],
          answer: 'foo',
          fieldType: 'textfield',
        },
      ]
      const expected = {
        formData: expectedFormData,
        autoReplyData: expectedAutoReplyData,
        jsonData: expectedJsonData,
      }
      prepareSubmissionThenCompare(expected, done)
    })

    it('excludes field if isVisible is false for autoReplyData', (done) => {
      const nonVisibleField = {
        _id: new ObjectID(),
        title: 'not visible to autoReplyData',
        fieldType: 'textfield',
      }
      const yesNoField = {
        _id: new ObjectID(),
        title: 'Show textfield if this field is yes',
        fieldType: 'yes_no',
      }
      const nonVisibleResponse = {
        _id: String(nonVisibleField._id),
        question: nonVisibleField.title,
        fieldType: nonVisibleField.fieldType,
        isHeader: false,
        answer: '',
      }
      const yesNoResponse = {
        _id: String(yesNoField._id),
        question: yesNoField.title,
        fieldType: yesNoField.fieldType,
        isHeader: false,
        answer: 'No',
      }

      reqFixtures.body.responses.push(nonVisibleResponse)
      reqFixtures.body.responses.push(yesNoResponse)
      reqFixtures.form.form_fields.push(nonVisibleField)
      reqFixtures.form.form_fields.push(yesNoField)
      reqFixtures.form.form_logics.push({
        show: [nonVisibleField._id],
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '58169',
            field: yesNoField._id,
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5db00a15af2ffb29487d4eb1',
        logicType: 'showFields',
      })
      const expectedJsonData = [
        {
          question: nonVisibleField.title,
          answer: nonVisibleResponse.answer,
        },
        {
          question: yesNoField.title,
          answer: yesNoResponse.answer,
        },
      ]
      const expectedFormData = [
        {
          question: nonVisibleField.title,
          answerTemplate: [nonVisibleResponse.answer],
          answer: nonVisibleResponse.answer,
          fieldType: nonVisibleField.fieldType,
        },
        {
          question: yesNoField.title,
          answerTemplate: [yesNoResponse.answer],
          answer: yesNoResponse.answer,
          fieldType: yesNoField.fieldType,
        },
      ]
      const expectedAutoReplyData = [
        {
          question: yesNoField.title,
          answerTemplate: [yesNoResponse.answer],
        },
      ]
      const expected = {
        autoReplyData: expectedAutoReplyData,
        jsonData: expectedJsonData,
        formData: expectedFormData,
      }
      prepareSubmissionThenCompare(expected, done)
    })

    it('prefixes attachment fields with [attachment]', (done) => {
      const validAttachmentName = 'valid.pdf'
      const fieldId = new ObjectID()
      reqFixtures.body.responses.push({
        _id: String(fieldId),
        question: 'an attachment',
        fieldType: 'attachment',
        isHeader: false,
        answer: validAttachmentName,
        filename: validAttachmentName,
        content: Buffer.alloc(1),
      })
      reqFixtures.form.form_fields.push({
        _id: fieldId,
        title: 'an attachment',
        fieldType: 'attachment',
        attachmentSize: '1',
      })
      const expectedJsonData = [
        {
          question: '[attachment] an attachment',
          answer: validAttachmentName,
        },
      ]
      const expectedFormData = [
        {
          question: '[attachment] an attachment',
          answerTemplate: [validAttachmentName],
          answer: validAttachmentName,
          fieldType: 'attachment',
        },
      ]
      const expectedAutoReplyData = [
        {
          question: 'an attachment',
          answerTemplate: [validAttachmentName],
        },
      ]
      const expected = {
        autoReplyData: expectedAutoReplyData,
        jsonData: expectedJsonData,
        formData: expectedFormData,
      }
      prepareSubmissionThenCompare(expected, done)
    })

    it('prefixes table fields with [table]', (done) => {
      const fieldId = new ObjectID()
      reqFixtures.body.responses.push({
        _id: String(fieldId),
        question: 'a table',
        fieldType: 'table',
        isHeader: false,
        answerArray: [['', '']],
      })
      reqFixtures.form.form_fields.push({
        _id: fieldId,
        title: 'a table',
        fieldType: 'table',
        columns: [
          { title: 'Name', fieldType: 'textfield' },
          { title: 'Age', fieldType: 'textfield' },
        ],
        minimumRows: 1,
      })
      const expectedJsonData = [
        {
          question: '[table] a table (Name, Age)',
          answer: ',',
        },
      ]
      const expectedFormData = [
        {
          question: '[table] a table (Name, Age)',
          answerTemplate: [','],
          answer: ',',
          fieldType: 'table',
        },
      ]
      const expectedAutoReplyData = [
        {
          question: 'a table (Name, Age)',
          answerTemplate: [','],
        },
      ]
      const expected = {
        autoReplyData: expectedAutoReplyData,
        jsonData: expectedJsonData,
        formData: expectedFormData,
      }
      prepareSubmissionThenCompare(expected, done)
    })

    it('selects only first response for each form field', (done) => {
      const fieldIds = times(15, () => String(new ObjectID()))
      const responseIds = fieldIds.map((id) => String(id))

      const fields = [
        makeField(fieldIds[0], 'section', 'Title for section'),
        makeField(fieldIds[1], 'radiobutton', 'Title for radiobutton', {
          fieldOptions: ['rb1', 'rb2'],
        }),
        makeField(fieldIds[2], 'dropdown', 'Title for dropdown', {
          fieldOptions: ['db1', 'db2'],
        }),
        makeField(fieldIds[3], 'email', 'Title for email', {
          autoReplyOptions: { hasAutoReply: false },
        }),
        makeField(fieldIds[4], 'table', 'Title for table', {
          minimumRows: 2,
          addMoreRows: false,
          maximumRows: 2,
          columns: [
            {
              title: 'Some dropdown',
              required: true,
              _id: '5ca5d548ddafb6c289893537',
              columnType: 'dropdown',
              fieldOptions: ['Option 1', 'Option 2'],
            },
            {
              title: 'Some textfield',
              required: true,
              _id: '5ca5d548ddafb6c289893538',
              columnType: 'textfield',
            },
          ],
        }),
        makeField(fieldIds[5], 'number', 'Title for number'),
        makeField(fieldIds[6], 'textfield', 'Title for textfield'),
        makeField(fieldIds[7], 'textarea', 'Title for textarea'),
        makeField(fieldIds[8], 'decimal', 'Title for decimal'),
        makeField(fieldIds[9], 'nric', 'Title for nric'),
        makeField(fieldIds[10], 'yes_no', 'Title for yes_no'),
        makeField(fieldIds[11], 'mobile', 'Title for mobile'),
        makeField(fieldIds[12], 'checkbox', 'Title for checkbox', {
          fieldOptions: ['cb1', 'cb2', 'cb3'],
        }),
        makeField(fieldIds[13], 'rating', 'Title for rating', {
          ratingOptions: { steps: 5, shape: 'Heart' },
        }),
        makeField(fieldIds[14], 'date', 'Title for date'),
      ]
      const responses = [
        makeResponse(responseIds[0], 'section', 'Title for section', ''),
        makeResponse(
          responseIds[1],
          'radiobutton',
          'Title for radiobutton',
          'rb1',
        ),
        makeResponse(responseIds[2], 'dropdown', 'Title for dropdown', 'db1'),
        makeResponse(responseIds[3], 'email', 'Title for email', 'abc@abc.com'),
        makeResponse(
          responseIds[4],
          'table',
          'Title for table',
          'Option 1, text 1',
          [
            ['Option 1', 'text 1'],
            ['Option 1', 'text 2'],
          ],
        ),
        makeResponse(responseIds[5], 'number', 'Title for number', '9000'),
        makeResponse(
          responseIds[6],
          'textfield',
          'Title for textfield',
          'hola',
        ),
        makeResponse(responseIds[7], 'textarea', 'Title for textarea', 'ciao'),
        makeResponse(responseIds[8], 'decimal', 'Title for decimal', '10.1'),
        makeResponse(responseIds[9], 'nric', 'Title for nric', 'S9912345A'),
        makeResponse(responseIds[10], 'yes_no', 'Title for yes_no', 'Yes'),
        makeResponse(
          responseIds[11],
          'mobile',
          'Title for mobile',
          '+6583838383',
        ),
        makeResponse(
          responseIds[12],
          'checkbox',
          'Title for checkbox',
          'cb1, cb2, cb3',
          ['cb1', 'cb2', 'cb3'],
        ),
        makeResponse(responseIds[13], 'rating', 'Title for rating', '5'),
        makeResponse(responseIds[14], 'date', 'Title for date', '15 Nov 2019'),
      ]

      const extra = [
        // Add extra responses
        makeResponse(responseIds[0], 'section', 'Title for section', ''),
        makeResponse(
          responseIds[1],
          'radiobutton',
          'Title for radiobutton',
          'rb2',
        ),
        makeResponse(responseIds[2], 'dropdown', 'Title for dropdown', 'db2'),
        makeResponse(responseIds[3], 'email', 'Title for email', 'xyz@xyz.com'),
        makeResponse(
          responseIds[4],
          'table',
          'Title for table',
          'Option 1, text 2',
          [
            ['Option 1', 'text 1'],
            ['Option 1', 'text 2'],
          ],
        ),
        makeResponse(
          responseIds[4],
          'table',
          'Title for table',
          'Option 2, text 3',
          [
            ['Option 1', 'text 1'],
            ['Option 1', 'text 2'],
            ['Option 2', 'text 3'],
            ['Option 2', 'text 4'],
          ],
        ),
        makeResponse(
          responseIds[4],
          'table',
          'Title for table',
          'Option 2, text 4',
          [
            ['Option 1', 'text 1'],
            ['Option 1', 'text 2'],
            ['Option 2', 'text 3'],
            ['Option 2', 'text 4'],
          ],
        ),
        makeResponse(responseIds[5], 'number', 'Title for number', '9999'),
        makeResponse(
          responseIds[6],
          'textfield',
          'Title for textfield',
          'hello',
        ),
        makeResponse(
          responseIds[7],
          'textarea',
          'Title for textarea',
          'byebye',
        ),
        makeResponse(responseIds[8], 'decimal', 'Title for decimal', '202.12'),
        makeResponse(responseIds[9], 'nric', 'Title for nric', 'S9634214D'),
        makeResponse(responseIds[10], 'yes_no', 'Title for yes_no', 'No'),
        makeResponse(
          responseIds[11],
          'mobile',
          'Title for mobile',
          '+6584848484',
        ),
        makeResponse(responseIds[12], 'checkbox', 'Title for checkbox', 'cb3', [
          'cb3',
        ]),
        makeResponse(responseIds[13], 'rating', 'Title for rating', '1'),
        makeResponse(responseIds[14], 'date', 'Title for date', '15 Dec 2019'),
      ]

      const expected = getExpectedOutput(fields, responses)
      reqFixtures.form.form_fields = fields
      reqFixtures.body.responses = responses.concat(extra)
      prepareSubmissionThenCompare(expected, done)
    })

    it('ignores statement and image fields in submission', (done) => {
      const fieldIds = times(4, () => new ObjectID())
      const responseIds = fieldIds.map((id) => String(id))
      const fields = [
        { _id: fieldIds[0], fieldType: 'section', title: 'Welcome to my form' },
        { _id: fieldIds[1], fieldType: 'statement', title: 'Hello there' },
        {
          _id: fieldIds[2],
          fieldType: 'image',
          title: 'Does image even have a title?',
          url: 'http://myimage.com/image.jpg',
        },
        { _id: fieldIds[3], fieldType: 'number', title: 'Lottery number' },
      ]
      const responses = [
        {
          _id: responseIds[0],
          fieldType: 'section',
          question: 'Welcome to my form',
          answer: '',
        },
        {
          _id: responseIds[1],
          fieldType: 'statement',
          question: 'Hello there',
          answer: '',
        },
        {
          _id: responseIds[2],
          fieldType: 'image',
          question: 'Does image even have a title?',
          answer: '',
        },
        {
          _id: responseIds[3],
          fieldType: 'number',
          question: 'Lottery number',
          answer: '37',
        },
      ]
      let expected = {
        autoReplyData: [],
        formData: [],
        jsonData: [],
      }
      for (let i = 0; i < fields.length; i++) {
        let { fieldType, title } = fields[i]
        let { answer } = responses[i]
        if (!['image', 'statement'].includes(fieldType)) {
          expected.autoReplyData.push({
            question: title,
            answerTemplate: String(answer).split('\n'),
          })
          if (fieldType !== 'section') {
            expected.jsonData.push({ question: title, answer: String(answer) })
          }
          expected.formData.push({
            question: title,
            answerTemplate: String(answer).split('\n'),
            answer,
            fieldType,
          })
        }
      }
      reqFixtures.form.form_fields = fields
      reqFixtures.body.responses = responses
      prepareSubmissionThenCompare(expected, done)
    })

    it('errors with 409 when some fields are not submitted', (done) => {
      const fields = [
        { _id: '1', fieldType: 'section', title: 'Welcome to my form' },
        { _id: '2', fieldType: 'number', title: 'Lottery number' },
      ]
      const responses = [
        {
          _id: '1',
          fieldType: 'section',
          question: 'Welcome to my form',
          answer: '',
        },
      ]
      reqFixtures.form.form_fields = fields
      reqFixtures.body.responses = responses
      request(app).get(endpointPath).expect(StatusCodes.CONFLICT).then(done)
    })

    describe('Logic', () => {
      describe('Single-select value', () => {
        const conditionField = makeField(
          new ObjectID(),
          'yes_no',
          'Show text field if yes',
        )
        const logicField = makeField(new ObjectID(), 'textfield', 'Text field')
        const visField = makeField(new ObjectID(), 'nric', 'Nric field')
        const fields = [conditionField, logicField, visField]
        const conditions = [
          {
            ifValueType: 'single-select',
            _id: '58169',
            field: conditionField._id,
            state: 'is equals to',
            value: 'Yes',
          },
        ]
        const _id = '5db00a15af2ffb29487d4eb1'
        const showFieldLogics = [
          {
            show: [logicField._id],
            conditions,
            _id,
            logicType: 'showFields',
          },
        ]
        const preventSubmitLogics = [
          {
            show: [],
            conditions,
            _id,
            preventSubmitMessage: 'test',
            logicType: 'preventSubmit',
          },
        ]
        const makeSingleSelectFixtures = (
          logics,
          conditionFieldVal,
          expectLogicFieldVisible,
        ) => {
          reqFixtures.form.form_fields = fields
          reqFixtures.form.form_logics = logics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField._id,
              conditionField.fieldType,
              conditionField.title,
              conditionFieldVal,
            ),
            makeResponse(
              logicField._id,
              logicField.fieldType,
              logicField.title,
              expectLogicFieldVisible ? 'lorem' : '',
              null,
              expectLogicFieldVisible,
            ),
            makeResponse(
              visField._id,
              visField.fieldType,
              visField.title,
              'S9912345A',
            ), // This field is always visible
          ]
        }

        const singleSelectSuccessTest = (
          logics,
          conditionFieldVal,
          expectLogicFieldVisible,
          done,
        ) => {
          makeSingleSelectFixtures(
            logics,
            conditionFieldVal,
            expectLogicFieldVisible,
          )
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        }

        it('hides logic fields for single select value', (done) => {
          // Does not fulfill condition, hence second field hidden
          singleSelectSuccessTest(showFieldLogics, 'No', false, done)
        })

        it('shows logic fields for single select value', (done) => {
          // Fulfills condition, hence second field shown
          singleSelectSuccessTest(showFieldLogics, 'Yes', true, done)
        })

        it('allows submission when not prevented by single select value', (done) => {
          // Does not fulfill condition, hence submission goes through
          singleSelectSuccessTest(preventSubmitLogics, 'No', true, done)
        })

        it('rejects submission prevented by single select value', (done) => {
          // Fulfills condition, hence submission rejected
          makeSingleSelectFixtures(preventSubmitLogics, 'Yes', true)
          expectStatusCodeError(StatusCodes.BAD_REQUEST, done)
        })
      })

      describe('Number value', () => {
        const conditionField = makeField(
          new ObjectID(),
          'number',
          'Show text field if less than 10',
        )
        const logicField = makeField(new ObjectID(), 'textfield', 'Text field')
        const visField = makeField(new ObjectID(), 'nric', 'Nric field')
        const fields = [conditionField, logicField, visField]
        const conditions = [
          {
            ifValueType: 'number',
            _id: '58169',
            field: conditionField._id,
            state: 'is less than or equal to',
            value: 10,
          },
        ]
        const _id = '5db00a15af2ffb29487d4eb1'
        const showFieldLogics = [
          {
            show: [logicField._id],
            conditions,
            _id,
            logicType: 'showFields',
          },
        ]
        const preventSubmitLogics = [
          {
            show: [],
            conditions,
            _id,
            preventSubmitMessage: 'test',
            logicType: 'preventSubmit',
          },
        ]
        const makeNumberValueFixtures = (
          logics,
          conditionFieldVal,
          expectLogicFieldVisible,
        ) => {
          reqFixtures.form.form_fields = fields
          reqFixtures.form.form_logics = logics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField._id,
              conditionField.fieldType,
              conditionField.title,
              conditionFieldVal,
            ),
            makeResponse(
              logicField._id,
              logicField.fieldType,
              logicField.title,
              expectLogicFieldVisible ? 'lorem' : '',
              null,
              expectLogicFieldVisible,
            ),
            makeResponse(
              visField._id,
              visField.fieldType,
              visField.title,
              'S9912345A',
            ), // This field is always visible
          ]
        }
        const numberValueSuccessTest = (
          logics,
          conditionFieldVal,
          expectLogicFieldVisible,
          done,
        ) => {
          makeNumberValueFixtures(
            logics,
            conditionFieldVal,
            expectLogicFieldVisible,
          )
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        }
        it('hides logic fields for number value', (done) => {
          // Second field hidden
          numberValueSuccessTest(showFieldLogics, '11', false, done)
        })

        it('shows logic for number value', (done) => {
          // Second field shown
          numberValueSuccessTest(showFieldLogics, '9', true, done)
        })

        it('accepts submission not prevented by number value', (done) => {
          // Condition not fulfilled, form goes through
          numberValueSuccessTest(preventSubmitLogics, '11', true, done)
        })

        it('rejects submission prevented by number value', (done) => {
          makeNumberValueFixtures(preventSubmitLogics, '9', true)
          expectStatusCodeError(StatusCodes.BAD_REQUEST, done)
        })
      })

      describe('Multi-select value', () => {
        const conditionField = makeField(
          new ObjectID(),
          'dropdown',
          'Show text field if value is Option 1 or Option 2',
          {
            fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
          },
        )
        const logicField = makeField(new ObjectID(), 'textfield', 'Text field')
        const visField = makeField(new ObjectID(), 'nric', 'Nric field')
        const fields = [conditionField, logicField, visField]
        const conditions = [
          {
            ifValueType: 'multi-select',
            _id: '58169',
            field: conditionField._id,
            state: 'is either',
            value: ['Option 1', 'Option 2'],
          },
        ]
        const _id = '5db00a15af2ffb29487d4eb1'
        const showFieldLogics = [
          {
            show: [logicField._id],
            conditions,
            _id,
            logicType: 'showFields',
          },
        ]
        const preventSubmitLogics = [
          {
            show: [],
            conditions,
            _id,
            preventSubmitMessage: 'test',
            logicType: 'preventSubmit',
          },
        ]
        const makeMultiSelectFixtures = (
          logics,
          conditionFieldVal,
          expectLogicFieldVisible,
        ) => {
          reqFixtures.form.form_fields = fields
          reqFixtures.form.form_logics = logics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField._id,
              conditionField.fieldType,
              conditionField.title,
              conditionFieldVal,
            ),
            makeResponse(
              logicField._id,
              logicField.fieldType,
              logicField.title,
              expectLogicFieldVisible ? 'lorem' : '',
              null,
              expectLogicFieldVisible,
            ),
            makeResponse(
              visField._id,
              visField.fieldType,
              visField.title,
              'S9912345A',
            ), // This field is always visible
          ]
        }
        const multiSelectSuccessTest = (
          logics,
          conditionFieldVal,
          expectLogicFieldVisible,
          done,
        ) => {
          makeMultiSelectFixtures(
            logics,
            conditionFieldVal,
            expectLogicFieldVisible,
          )
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        }

        it('hides logic fields for multi-select value', (done) => {
          multiSelectSuccessTest(showFieldLogics, 'Option 3', false, done)
        })

        it('shows logic for multi-select value', (done) => {
          multiSelectSuccessTest(showFieldLogics, 'Option 1', true, done)
        })

        it('allows submission not prevented by logic', (done) => {
          multiSelectSuccessTest(preventSubmitLogics, 'Option 3', true, done)
        })

        it('rejects submissions prevented by logic', (done) => {
          makeMultiSelectFixtures(preventSubmitLogics, 'Option 1', true)
          expectStatusCodeError(StatusCodes.BAD_REQUEST, done)
        })
      })

      describe('supports multiple AND conditions', () => {
        const conditionField1 = makeField(
          new ObjectID(),
          'yes_no',
          'Show text field if yes',
        )
        const conditionField2 = makeField(
          new ObjectID(),
          'dropdown',
          'Show text field if dropdown says Textfield',
          {
            fieldOptions: ['Textfield', 'Radiobutton', 'Email'],
          },
        )
        const logicField = makeField(new ObjectID(), 'textfield', 'Text field')
        const fields = [conditionField1, conditionField2, logicField]
        const conditions = [
          {
            ifValueType: 'single-select',
            _id: '9577',
            field: conditionField1._id,
            state: 'is equals to',
            value: 'Yes',
          },
          {
            ifValueType: 'single-select',
            _id: '45633',
            field: conditionField2._id,
            state: 'is equals to',
            value: 'Textfield',
          },
        ]
        const _id = '5df11ee1e6b6e7108a939c8a'
        const showFieldLogics = [
          {
            show: [logicField._id],
            conditions,
            _id,
            logicType: 'showFields',
          },
        ]
        const preventSubmitLogics = [
          {
            show: [logicField._id],
            conditions,
            _id,
            preventSubmitMessage: 'test',
            logicType: 'preventSubmit',
          },
        ]
        const makeMultiAndFixtures = (
          logics,
          conditionField1Val,
          conditionField2Val,
          expectLogicFieldVisible,
        ) => {
          reqFixtures.form.form_fields = fields
          reqFixtures.form.form_logics = logics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField1._id,
              conditionField1.fieldType,
              conditionField1.title,
              conditionField1Val,
            ),
            makeResponse(
              conditionField2._id,
              conditionField2.fieldType,
              conditionField2.title,
              conditionField2Val,
            ),
            makeResponse(
              logicField._id,
              logicField.fieldType,
              logicField.title,
              expectLogicFieldVisible ? 'lorem' : '',
              null,
              expectLogicFieldVisible,
            ),
          ]
        }
        const multiAndSuccessTest = (
          logics,
          conditionField1Val,
          conditionField2Val,
          expectLogicFieldVisible,
          done,
        ) => {
          makeMultiAndFixtures(
            logics,
            conditionField1Val,
            conditionField2Val,
            expectLogicFieldVisible,
          )
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        }

        it('hides logic fields if any condition is not fulfilled', (done) => {
          multiAndSuccessTest(
            showFieldLogics,
            'Yes',
            'Radiobutton',
            false,
            done,
          )
        })

        it('shows logic fields if every condition is fulfilled', (done) => {
          multiAndSuccessTest(showFieldLogics, 'Yes', 'Textfield', true, done)
        })

        it('discards invalid logic when a condition is missing', (done) => {
          reqFixtures.form.form_fields = [conditionField2, logicField] // Missing conditionField1
          reqFixtures.form.form_logics = showFieldLogics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField2._id,
              conditionField2.fieldType,
              conditionField2.title,
              'Radiobutton',
            ), // Does not fulfill condition
            makeResponse(
              logicField._id,
              logicField.fieldType,
              logicField.title,
              'lorem',
              null,
              true,
            ), // This field should be shown because logic has been discarded
          ]
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        })

        it('accepts submissions not prevented by logic', (done) => {
          multiAndSuccessTest(
            preventSubmitLogics,
            'Yes',
            'Radiobutton',
            true,
            done,
          )
        })

        it('rejects submissions prevented by logic', (done) => {
          makeMultiAndFixtures(preventSubmitLogics, 'Yes', 'Textfield', true)
          expectStatusCodeError(StatusCodes.BAD_REQUEST, done)
        })
      })

      describe('supports multiple OR conditions', () => {
        const conditionField1 = makeField(
          new ObjectID(),
          'yes_no',
          'Show text field if yes',
        )
        const conditionField2 = makeField(
          new ObjectID(),
          'dropdown',
          'Show text field if dropdown says Textfield',
          {
            fieldOptions: ['Textfield', 'Radiobutton', 'Email'],
          },
        )
        const logicField = makeField(new ObjectID(), 'textfield', 'Text field')
        const fields = [conditionField1, conditionField2, logicField]
        const conditionses = [
          [
            {
              ifValueType: 'single-select',
              _id: '9577',
              field: conditionField1._id,
              state: 'is equals to',
              value: 'Yes',
            },
          ],
          [
            {
              ifValueType: 'single-select',
              _id: '89906',
              field: conditionField2._id,
              state: 'is equals to',
              value: 'Textfield',
            },
          ],
        ]
        const _ids = ['5df11ee1e6b6e7108a939c8a', '5df127a2e6b6e7108a939c90']
        const showFieldLogics = _.zipWith(
          conditionses,
          _ids,
          (conditions, _id) => {
            return {
              show: [logicField._id],
              conditions,
              _id,
              logicType: 'showFields',
            }
          },
        )
        const preventSubmitLogics = _.zipWith(
          conditionses,
          _ids,
          (conditions, _id) => {
            return { show: [], conditions, _id, logicType: 'preventSubmit' }
          },
        )
        const makeOrFixtures = (
          logics,
          conditionField1Val,
          conditionField2Val,
          expectLogicFieldVisible,
        ) => {
          reqFixtures.form.form_fields = fields
          reqFixtures.form.form_logics = logics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField1._id,
              conditionField1.fieldType,
              conditionField1.title,
              conditionField1Val,
            ),
            makeResponse(
              conditionField2._id,
              conditionField2.fieldType,
              conditionField2.title,
              conditionField2Val,
            ),
            makeResponse(
              logicField._id,
              logicField.fieldType,
              logicField.title,
              expectLogicFieldVisible ? 'lorem' : '',
              null,
              expectLogicFieldVisible,
            ),
          ]
        }
        const orSuccessTest = (
          logics,
          conditionField1Val,
          conditionField2Val,
          expectLogicFieldVisible,
          done,
        ) => {
          makeOrFixtures(
            logics,
            conditionField1Val,
            conditionField2Val,
            expectLogicFieldVisible,
          )
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        }

        it('hides logic fields if every condition is not fulfilled', (done) => {
          orSuccessTest(showFieldLogics, 'No', 'Radiobutton', false, done)
        })

        it('shows logic fields if any condition is fulfilled', (done) => {
          orSuccessTest(showFieldLogics, 'Yes', 'Radiobutton', true, done)
        })

        it('accepts submission not prevented by logic', (done) => {
          orSuccessTest(preventSubmitLogics, 'No', 'Radiobutton', true, done)
        })

        it('rejects submission prevented by logic', (done) => {
          makeOrFixtures(preventSubmitLogics, 'Yes', 'Radiobutton', true)
          expectStatusCodeError(StatusCodes.BAD_REQUEST, done)
        })
      })

      describe('supports multiple showable fields', () => {
        const conditionField = makeField(
          new ObjectID(),
          'yes_no',
          'Show text field if yes',
        )
        const logicField1 = makeField(new ObjectID(), 'textfield', 'Text field')
        const logicField2 = makeField(
          new ObjectID(),
          'textarea',
          'Long text field',
        )
        const fields = [conditionField, logicField1, logicField2]
        const formLogics = [
          {
            show: [logicField1._id, logicField2._id],
            conditions: [
              {
                ifValueType: 'single-select',
                _id: '58169',
                field: conditionField._id,
                state: 'is equals to',
                value: 'Yes',
              },
            ],
            _id: '5db00a15af2ffb29487d4eb1',
            logicType: 'showFields',
          },
        ]
        it('hides multiple logic fields when condition is not fulfilled', (done) => {
          reqFixtures.form.form_fields = fields
          reqFixtures.form.form_logics = formLogics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField._id,
              conditionField.fieldType,
              conditionField.title,
              'No',
            ), // Does not fulfill condition
            makeResponse(
              logicField1._id,
              logicField1.fieldType,
              logicField1.title,
              '',
              null,
              false,
            ), // This field should be hidden
            makeResponse(
              logicField2._id,
              logicField2.fieldType,
              logicField2.title,
              '',
              null,
              false,
            ), // This field should be hidden
          ]
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        })

        it('shows multiple logic fields when condition is fulfilled', (done) => {
          reqFixtures.form.form_fields = fields
          reqFixtures.form.form_logics = formLogics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField._id,
              conditionField.fieldType,
              conditionField.title,
              'Yes',
            ), // Fulfills condition
            makeResponse(
              logicField1._id,
              logicField1.fieldType,
              logicField1.title,
              'lorem',
              null,
              true,
            ), // This field should be shown
            makeResponse(
              logicField2._id,
              logicField2.fieldType,
              logicField2.title,
              'ipsum',
              null,
              true,
            ), // This field should be shown
          ]
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        })

        it('should hide unfulfilled logic field even when some of the logic fields are missing', (done) => {
          reqFixtures.form.form_fields = [conditionField, logicField1] // Missing logicField2
          reqFixtures.form.form_logics = formLogics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField._id,
              conditionField.fieldType,
              conditionField.title,
              'No',
            ), //  Does not fulfill condition
            makeResponse(
              logicField1._id,
              logicField1.fieldType,
              logicField1.title,
              '',
              null,
              false,
            ), // This field should be hidden
          ]
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        })

        it('should show fulfilled logic field even when some of the logic fields are missing', (done) => {
          reqFixtures.form.form_fields = [conditionField, logicField1] // Missing logicField2
          reqFixtures.form.form_logics = formLogics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField._id,
              conditionField.fieldType,
              conditionField.title,
              'Yes',
            ), // Fulfills condition
            makeResponse(
              logicField1._id,
              logicField1.fieldType,
              logicField1.title,
              'lorem',
              null,
              true,
            ), // This field should be shown
          ]
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        })
      })

      describe('supports chained logic', () => {
        const conditionField1 = makeField(
          new ObjectID(),
          'rating',
          'Show radio if rating is more than or equal 2',
          {
            ratingOptions: {
              steps: 5,
              shape: 'Heart',
            },
          },
        )
        const conditionField2 = makeField(
          new ObjectID(),
          'radiobutton',
          'Show date if radio is others',
          {
            fieldOptions: ['Option 1', 'Option 2'],
            othersRadioButton: true,
          },
        )
        const logicField = makeField(new ObjectID(), 'date', 'Date field')
        const fields = [conditionField1, conditionField2, logicField]
        const showFieldLogics = [
          {
            show: [conditionField2._id],
            _id: '5df12cf8e6b6e7108a939c99',
            conditions: [
              {
                ifValueType: 'single-select',
                _id: '57184',
                field: conditionField1._id,
                state: 'is more than or equal to',
                value: 2,
              },
            ],
            logicType: 'showFields',
          },
          {
            show: [logicField._id],
            _id: '5df12d0ee6b6e7108a939c9a',
            conditions: [
              {
                ifValueType: 'single-select',
                _id: '48323',
                field: conditionField2._id,
                state: 'is equals to',
                value: 'Others',
              },
            ],
            logicType: 'showFields',
          },
        ]
        const preventSubmitLogics = [
          {
            show: [conditionField2._id],
            _id: '5df12cf8e6b6e7108a939c99',
            conditions: [
              {
                ifValueType: 'single-select',
                _id: '57184',
                field: conditionField1._id,
                state: 'is more than or equal to',
                value: 2,
              },
            ],
            logicType: 'showFields',
          },
          {
            show: [],
            _id: '5df12d0ee6b6e7108a939c9a',
            conditions: [
              {
                ifValueType: 'single-select',
                _id: '48323',
                field: conditionField2._id,
                state: 'is equals to',
                value: 'Others',
              },
            ],
            logicType: 'preventSubmit',
          },
        ]
        const makeChainedFixtures = (
          logics,
          conditionField1Val,
          conditionField2Val,
          expectedField2Visible,
          expectLogicFieldVisible,
        ) => {
          reqFixtures.form.form_fields = fields
          reqFixtures.form.form_logics = logics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField1._id,
              conditionField1.fieldType,
              conditionField1.title,
              conditionField1Val,
            ),
            makeResponse(
              conditionField2._id,
              conditionField2.fieldType,
              conditionField2.title,
              expectedField2Visible ? conditionField2Val : '',
              null,
              expectedField2Visible,
            ),
            makeResponse(
              logicField._id,
              logicField.fieldType,
              logicField.title,
              expectLogicFieldVisible ? '12 Dec 2019' : '',
              null,
              expectLogicFieldVisible,
            ),
          ]
        }
        const chainedSuccessTest = (
          logics,
          conditionField1Val,
          conditionField2Val,
          expectedField2Visible,
          expectLogicFieldVisible,
          done,
        ) => {
          makeChainedFixtures(
            logics,
            conditionField1Val,
            conditionField2Val,
            expectedField2Visible,
            expectLogicFieldVisible,
          )
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        }
        it('shows chained logic', (done) => {
          chainedSuccessTest(
            showFieldLogics,
            '2',
            'Others: peas',
            true,
            true,
            done,
          )
        })

        it('hides chained logic', (done) => {
          chainedSuccessTest(
            showFieldLogics,
            '1',
            'Others: peas',
            false,
            false,
            done,
          )
        })

        it('accepts submission not prevented by chained logic', (done) => {
          chainedSuccessTest(
            preventSubmitLogics,
            '2',
            'Option 1',
            true,
            true,
            done,
          )
        })

        it('rejects submission prevented by chained logic', (done) => {
          makeChainedFixtures(
            preventSubmitLogics,
            '2',
            'Others: peas',
            true,
            true,
          )
          expectStatusCodeError(StatusCodes.BAD_REQUEST, done)
        })
      })

      describe('supports logic regardless of field order', () => {
        const conditionField1 = makeField(
          new ObjectID(),
          'rating',
          'Show radio if rating is more than or equal 2',
          {
            ratingOptions: {
              steps: 5,
              shape: 'Heart',
            },
          },
        )
        const conditionField2 = makeField(
          new ObjectID(),
          'radiobutton',
          'Show date if radio is others',
          {
            fieldOptions: ['Option 1', 'Option 2'],
            othersRadioButton: true,
          },
        )
        const logicField = makeField(new ObjectID(), 'date', 'Date field')
        const fields = [conditionField1, logicField, conditionField2]
        const formLogics = [
          {
            show: [conditionField2._id],
            _id: '5df12cf8e6b6e7108a939c99',
            conditions: [
              {
                ifValueType: 'single-select',
                _id: '57184',
                field: conditionField1._id,
                state: 'is more than or equal to',
                value: 2,
              },
            ],
            logicType: 'showFields',
          },
          {
            show: [logicField._id],
            _id: '5df12d0ee6b6e7108a939c9a',
            conditions: [
              {
                ifValueType: 'single-select',
                _id: '48323',
                field: conditionField2._id,
                state: 'is equals to',
                value: 'Others',
              },
            ],
            logicType: 'showFields',
          },
        ]
        it('shows logic regardless of field order', (done) => {
          reqFixtures.form.form_fields = fields
          reqFixtures.form.form_logics = formLogics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField1._id,
              conditionField1.fieldType,
              conditionField1.title,
              '2',
            ), // Fulfills condition
            makeResponse(
              logicField._id,
              logicField.fieldType,
              logicField.title,
              '12 Dec 2019',
              null,
              true,
            ), // This field should be shown
            makeResponse(
              conditionField2._id,
              conditionField2.fieldType,
              conditionField2.title,
              'Others: peas',
            ), // Fulfills condition
          ]
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        })
      })
      describe('circular logic', () => {
        const conditionField1 = makeField(
          new ObjectID(),
          'yes_no',
          'Show field 2 if yes',
        )
        const conditionField2 = makeField(
          new ObjectID(),
          'yes_no',
          'Show field 3 if yes',
        )
        const conditionField3 = makeField(
          new ObjectID(),
          'yes_no',
          'Show field 1 if yes',
        )
        const visibleField = makeField(
          new ObjectID(),
          'textfield',
          'Text field',
        )
        const formLogics = [
          {
            show: [conditionField2._id],
            _id: '5df11ee1e6b6e7108a939c8a',
            conditions: [
              {
                ifValueType: 'single-select',
                _id: '9577',
                field: conditionField1._id,
                state: 'is equals to',
                value: 'Yes',
              },
            ],
            logicType: 'showFields',
          },
          {
            show: [conditionField3._id],
            _id: '5df11ee1e6b6e7108a939c8b',
            conditions: [
              {
                ifValueType: 'single-select',
                _id: '9577',
                field: conditionField2._id,
                state: 'is equals to',
                value: 'Yes',
              },
            ],
            logicType: 'showFields',
          },
          {
            show: [conditionField1._id],
            _id: '5df11ee1e6b6e7108a939c8c',
            conditions: [
              {
                ifValueType: 'single-select',
                _id: '9578',
                field: conditionField3._id,
                state: 'is equals to',
                value: 'Yes',
              },
            ],
            logicType: 'showFields',
          },
        ]
        it('correctly parses circular logic where all fields are hidden', (done) => {
          reqFixtures.form.form_fields = [
            conditionField1,
            conditionField2,
            conditionField3,
          ]
          reqFixtures.form.form_logics = formLogics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField1._id,
              conditionField1.fieldType,
              conditionField1.title,
              '',
              null,
              false,
            ), // Circular, never shown
            makeResponse(
              conditionField2._id,
              conditionField2.fieldType,
              conditionField2.title,
              '',
              null,
              false,
            ), // Circular, never shown
            makeResponse(
              conditionField3._id,
              conditionField3.fieldType,
              conditionField3.title,
              '',
              null,
              false,
            ), // Circular, never shown
          ]
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        })
        it('correctly parses circular logic for a mix of hidden and shown fields', (done) => {
          reqFixtures.form.form_fields = [
            conditionField1,
            conditionField2,
            conditionField3,
            visibleField,
          ]
          reqFixtures.form.form_logics = formLogics
          reqFixtures.body.responses = [
            makeResponse(
              conditionField1._id,
              conditionField1.fieldType,
              conditionField1.title,
              '',
              null,
              false,
            ), // Circular, never shown
            makeResponse(
              conditionField2._id,
              conditionField2.fieldType,
              conditionField2.title,
              '',
              null,
              false,
            ), // Circular, never shown
            makeResponse(
              conditionField3._id,
              conditionField3.fieldType,
              conditionField3.title,
              '',
              null,
              false,
            ), // Circular, never shown
            makeResponse(
              visibleField._id,
              visibleField.fieldType,
              visibleField.title,
              'lorem',
            ), // Always shown
          ]
          const expected = getExpectedOutput(
            reqFixtures.form.form_fields,
            reqFixtures.body.responses,
          )
          prepareSubmissionThenCompare(expected, done)
        })
      })
    })
  })

  describe('Verified fields', () => {
    let fixtures
    let testAgency, testUser, testForm

    const expireAt = new Date()
    expireAt.setTime(
      expireAt.getTime() + vfnConstants.TRANSACTION_EXPIRE_AFTER_SECONDS * 1000,
    ) // Expires 4 hours later
    const hasExpired = new Date()
    hasExpired.setTime(
      hasExpired.getTime() -
        vfnConstants.TRANSACTION_EXPIRE_AFTER_SECONDS * 2000,
    ) // Expired 2 days ago

    const endpointPath = '/submissions'
    const injectFixtures = (req, res, next) => {
      Object.assign(req, fixtures)
      next()
    }
    const sendSubmissionBack = (req, res) => {
      res.status(200).send({
        body: req.body,
      })
    }

    const app = express()

    const sendAndExpect = (status, expectedResponse = null) => {
      let send = request(app).post(endpointPath).expect(status)
      if (expectedResponse) {
        send = send.expect(expectedResponse)
      }
      return send
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

    beforeAll((done) => {
      app
        .route(endpointPath)
        .post(
          injectFixtures,
          EmailSubmissionsMiddleware.validateEmailSubmission,
          sendSubmissionBack,
        )
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

    // Submission
    describe('No verified fields in form', () => {
      beforeEach((done) => {
        testForm = new Form({
          title: 'Test Form',
          emails: 'test@test.gov.sg',
          admin: testUser._id,
          responseMode: 'email',
          form_fields: [{ title: 'Email', fieldType: 'email' }],
        })
        testForm
          .save({ validateBeforeSave: false })
          .then(() => {
            fixtures = {
              form: testForm,
              body: {
                responses: [],
              },
            }
          })
          .then(done)
      })
      it('should allow submission if transaction does not exist for forms that do not contain any fields that have to be verified', (done) => {
        // No transaction created for testForm
        const field = testForm.form_fields[0]
        const response = {
          _id: String(field._id),
          fieldType: field.fieldType,
          question: field.title,
          answer: 'test@abc.com',
        }
        fixtures.body.responses.push(response)
        sendAndExpect(StatusCodes.OK, {
          body: {
            parsedResponses: [Object.assign(response, { isVisible: true })],
          },
        }).end(done)
      })
    })
    describe('Verified fields', () => {
      let createTransaction
      beforeAll((done) => {
        testForm = new Form({
          title: 'Test Form',
          emails: 'test@test.gov.sg',
          responseMode: 'email',
          admin: testUser._id,
          form_fields: [
            { title: 'Email', fieldType: 'email', isVerifiable: true },
          ],
        })
        testForm
          .save({ validateBeforeSave: false })
          .then(() => {
            createTransaction = createTransactionForForm(testForm)
          })
          .then(done)
      })
      beforeEach(() => {
        fixtures = {
          form: testForm,
          body: {
            responses: [],
          },
        }
      })

      describe('No transaction', () => {
        it('should prevent submission if transaction does not exist for a form containing fields that have to be verified', (done) => {
          const field = testForm.form_fields[0]
          const response = {
            _id: String(field._id),
            fieldType: field.fieldType,
            question: field.title,
            answer: 'test@abc.com',
          }
          fixtures.body.responses.push(response)

          sendAndExpect(StatusCodes.BAD_REQUEST).end(done)
        })
      })

      describe('Has transaction', () => {
        it('should prevent submission if transaction has expired for a form containing fields that have to be verified', (done) => {
          createTransaction(hasExpired, [
            {
              fieldType: 'email',
              hashCreatedAt: new Date(),
              hashedOtp: 'someHashValue',
              signedData: 'someData',
            },
          ]).then(() => {
            const field = testForm.form_fields[0]
            const response = {
              _id: String(field._id),
              fieldType: field.fieldType,
              question: field.title,
              answer: 'test@abc.com',
              signature: 'someData',
            }
            fixtures.body.responses.push(response)

            sendAndExpect(StatusCodes.BAD_REQUEST).end(done)
          })
        })

        it('should prevent submission if any of the transaction fields are not verified', (done) => {
          createTransaction(expireAt, [
            {
              fieldType: 'email',
              hashCreatedAt: null,
              hashedOtp: null,
              signedData: null,
            },
          ]).then(() => {
            const field = testForm.form_fields[0]
            const response = {
              _id: String(field._id),
              fieldType: field.fieldType,
              question: field.title,
              answer: 'test@abc.com',
            }
            fixtures.body.responses.push(response)

            sendAndExpect(StatusCodes.BAD_REQUEST).end(done)
          })
        })

        it('should allow submission if all of the transaction fields are verified', (done) => {
          const formsg = require('@opengovsg/formsg-sdk')({
            mode: 'test',
            verificationOptions: {
              secretKey: process.env.VERIFICATION_SECRET_KEY,
            },
          })
          const transactionId = mongoose.Types.ObjectId(
            '5e71ef8b19c1ed04b54cd5f9',
          )

          const field = testForm.form_fields[0]
          const formId = testForm._id
          let response = {
            _id: String(field._id),
            fieldType: field.fieldType,
            question: field.title,
            answer: 'test@abc.com',
          }
          const signature = formsg.verification.generateSignature({
            transactionId: String(transactionId),
            formId: String(formId),
            fieldId: response._id,
            answer: response.answer,
          })
          response.signature = signature

          createTransaction(expireAt, [
            {
              fieldType: 'email',
              hashCreatedAt: new Date(),
              hashedOtp: 'someHashValue',
              signedData: signature,
            },
          ]).then(() => {
            fixtures.body.responses.push(response)
            sendAndExpect(StatusCodes.OK).end(done)
          })
        })
      })
    })

    describe('Hidden and optional fields', () => {
      const expireAt = new Date()
      expireAt.setTime(expireAt.getTime() + 86400)

      beforeEach(() => {
        fixtures = {
          form: {},
          body: {
            responses: [],
          },
        }
      })

      const test = ({
        fieldValue,
        fieldIsRequired,
        fieldIsHidden,
        expectedStatus,
        done,
      }) => {
        const field = {
          _id: '5e719d5b62a2c4aa5d9789e2',
          title: 'Email',
          fieldType: 'email',
          isVerifiable: true,
          required: fieldIsRequired,
        }
        const yesNoField = {
          _id: '5e719d5b62a2c4aa5d9789e3',
          title: 'Show email if this field is yes',
          fieldType: 'yes_no',
        }
        let form = new Form({
          title: 'Test Form',
          emails: 'test@test.gov.sg',
          responseMode: 'email',
          admin: testUser._id,
          form_fields: [field, yesNoField],
          form_logics: [
            {
              show: [field._id],
              conditions: [
                {
                  ifValueType: 'single-select',
                  _id: '58169',
                  field: yesNoField._id,
                  state: 'is equals to',
                  value: 'Yes',
                },
              ],
              _id: '5db00a15af2ffb29487d4eb1',
              logicType: 'showFields',
            },
          ],
        })
        form.save({ validateBeforeSave: false }).then(() => {
          const response = {
            _id: String(field._id),
            fieldType: field.fieldType,
            question: field.title,
            answer: fieldValue,
          }
          const yesNoResponse = {
            _id: yesNoField._id,
            question: yesNoField.title,
            fieldType: yesNoField.fieldType,
            answer: fieldIsHidden ? 'No' : 'Yes',
          }
          fixtures.form = form
          fixtures.body.responses.push(yesNoResponse)
          fixtures.body.responses.push(response)
          sendAndExpect(expectedStatus).end(done)
        })
      }
      it('should verify fields that are optional and filled in', (done) => {
        test({
          fieldValue: 'test@abc.com',
          fieldIsRequired: false,
          fieldIsHidden: false,
          expectedStatus: StatusCodes.BAD_REQUEST,
          done,
        })
      })
      it('should not verify fields that are optional and not filled in', (done) => {
        test({
          fieldValue: '',
          fieldIsRequired: false,
          fieldIsHidden: false,
          expectedStatus: StatusCodes.OK,
          done,
        })
      })
      it('should verify fields that are required and not hidden by logic', (done) => {
        test({
          fieldValue: 'test@abc.com',
          fieldIsRequired: true,
          fieldIsHidden: false,
          expectedStatus: StatusCodes.BAD_REQUEST,
          done,
        })
      })

      it('should not verify fields that are required and hidden by logic', (done) => {
        test({
          fieldValue: '',
          fieldIsRequired: true,
          fieldIsHidden: true,
          expectedStatus: StatusCodes.OK,
          done,
        })
      })
    })
  })
})
