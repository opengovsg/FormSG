const MockAdapter = require('axios-mock-adapter')
const axios = require('axios')
const { StatusCodes } = require('http-status-codes')
const ejs = require('ejs')
const express = require('express')
const request = require('supertest')
const mongoose = require('mongoose')

const dbHandler = require('../helpers/db-handler')

describe('Submissions Controller', () => {
  // Declare global variables
  const mailServicePath = '../services/mail/mail.service'
  const mockAxios = new MockAdapter(axios)
  const mockSendNodeMail = jasmine.createSpy()

  const controllerStub = {
    [mailServicePath]: {
      sendNodeMail: mockSendNodeMail,
    },
    mongoose: Object.assign(mongoose, {
      '@noCallThru': true,
    }),
  }
  const Controller = spec(
    'dist/backend/app/controllers/submissions.server.controller',
    controllerStub,
  )

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => {
    mockAxios.reset()
    await dbHandler.clearDatabase()
  })
  afterAll(async () => {
    mockAxios.restore()
    await dbHandler.closeDatabase()
  })

  describe('sendEmailAutoReply', () => {
    const originalConsoleError = console.error

    let fixtures

    const endpointPath = '/reply-sender'
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
      app.route(endpointPath).get(injectFixtures, Controller.sendAutoReply)
    })

    afterAll(() => {
      console.error = originalConsoleError
    })

    beforeEach(() => {
      controllerStub[mailServicePath].sendNodeMail = jasmine.createSpy()
      fixtures = {
        autoReplyEmails: [{ email: 'sender@from.elsewhere' }],
        attachments: [
          {
            filename: 'file.txt',
            content: Buffer.alloc(5),
          },
        ],
        form: {
          title: 'Form Title',
          emails: ['test@test.gov.sg'],
          admin: {
            agency: {
              fullName: 'Government Testing Agency',
              shortName: 'GovTest',
            },
          },
        },
        autoReplyData: [
          {
            question: 'foo',
            answerTemplate: ['bar'],
          },
        ],
        submission: {
          id: 1,
          created: Date.now(),
        },
      }
    })

    const expectMailCorrect = (autoReplyFields, testFn) => (done) => {
      const [autoReplyEmail] = fixtures.autoReplyEmails
      Object.assign(autoReplyEmail, autoReplyFields)

      controllerStub[mailServicePath].sendNodeMail.and.callFake(({ mail }) => {
        testFn(mail)
      })

      request(app).get(endpointPath).expect(StatusCodes.OK).end(done)
    }

    it(
      'sends mail with default parameters',
      expectMailCorrect({}, (mail) => {
        expect(mail.to).toEqual(fixtures.autoReplyEmails[0].email)
        expect(mail.from).toContain(fixtures.form.admin.agency.fullName)
        expect(mail.subject).toContain(fixtures.form.title)
        expect(mail.html).toContain(fixtures.form.admin.agency.fullName)
        expect(mail.attachments).toEqual([])
      }),
    )

    it(
      'sends mail with custom parameters',
      expectMailCorrect(
        {
          subject: 'Custom Subject',
          sender: 'Custom Sender',
          body: 'Custom Body',
        },
        (mail) => {
          expect(mail.to).toEqual(fixtures.autoReplyEmails[0].email)
          expect(mail.from).toContain(fixtures.autoReplyEmails[0].sender)
          expect(mail.subject).toContain(fixtures.autoReplyEmails[0].subject)
          expect(mail.html).toContain('Custom Body')
          expect(mail.attachments).toEqual([])
        },
      ),
    )

    it(
      'sends mail with form summary',
      expectMailCorrect({ includeFormSummary: true }, (mail) => {
        expect(mail.to).toEqual(fixtures.autoReplyEmails[0].email)
        expect(mail.from).toContain(fixtures.form.admin.agency.fullName)
        expect(mail.subject).toContain(fixtures.form.title)
        expect(mail.html).toBeDefined()
        expect(mail.html).toContain(fixtures.autoReplyData[0].question)
        expect(mail.html).toContain(fixtures.autoReplyData[0].answerTemplate)
        expect(mail.attachments.map((f) => f.filename)).toEqual([
          fixtures.attachments[0].filename,
          'response.pdf',
        ])
      }),
    )

    it('does not send mails if no-one to reply to', (done) => {
      fixtures.autoReplyEmails = []
      mockSendNodeMail.calls.reset()
      request(app)
        .get(endpointPath)
        .expect(StatusCodes.OK)
        .end(() => {
          expect(mockSendNodeMail).not.toHaveBeenCalled()
          done()
        })
    })
  })
})
