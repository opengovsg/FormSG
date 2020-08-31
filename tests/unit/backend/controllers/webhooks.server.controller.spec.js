const MockAdapter = require('axios-mock-adapter')
const axios = require('axios')
const { OK, FORBIDDEN } = require('http-status-codes')
const mongoose = require('mongoose')

const {
  validateWebhookUrl,
} = require('../../../../dist/backend/shared/util/webhook-validation')
const dbHandler = require('../helpers/db-handler')

const Submission = dbHandler.makeModel('submission.server.model', 'Submission')
const controllerPath = 'dist/backend/app/controllers/webhooks.server.controller'
const validateWebhookUrlPath = '../../shared/util/webhook-validation'
const webhookUtilsPath = '../modules/webhook/webhooks.service'
const defaultWebhookUrl = 'https://test.site'
let mockAxios

describe('Webhook URL validation', () => {
  it('should accept valid HTTPS URLs', (done) => {
    validateWebhookUrl('https://staging.form.gov.sg')
      .then(done)
      .catch(() => {
        done(new Error('Webhook validator did not accept valid URL.'))
      })
  })
  it('should reject non-HTTPS URLs', (done) => {
    validateWebhookUrl('http://some.website')
      .then(() => done(new Error('Webhook validator accepted HTTP URL.')))
      .catch(() => {
        done()
      })
  })
  it('should reject URLs which do not resolve to any IP', (done) => {
    validateWebhookUrl('https://some.nonsense.website')
      .then(() =>
        done(
          new Error(
            'Webhook validator accepted URL which fails DNS resolution.',
          ),
        ),
      )
      .catch(() => {
        done()
      })
  })
  it('should reject URLs which resolve to private IPs', (done) => {
    validateWebhookUrl('https://localtest.me')
      .then(() =>
        done(
          new Error('Webhook validator accepted URL pointing to private IP.'),
        ),
      )
      .catch(() => {
        done()
      })
  })
})

describe('Webhook controller', () => {
  let req, res, next

  beforeAll(async () => {
    await dbHandler.connect()
    mockAxios = new MockAdapter(axios)
  })

  beforeEach(async (done) => {
    req = await getDefaultReq()
    res = null
    next = jasmine.createSpy()
    spyOn(axios, 'post').and.callThrough()
    spyOn(console, 'error')
    spyOn(console, 'info')
    done()
  })
  afterAll(async () => {
    mockAxios.restore()
    await dbHandler.closeDatabase()
  })
  afterEach(async () => {
    mockAxios.reset()
    await dbHandler.clearDatabase()
  })

  // Mock the validateWebhookUrl function to reject, spy on the webhook
  // failure handler and expect validateWebhookUrl, failure handler and
  // next to have been called.
  it('should call the error handler if webhook validation fails', (done) => {
    const validateWebhookUrlSpy = jasmine
      .createSpy('validateWebhookUrl')
      .and.callFake(() => Promise.reject())
    const handleWebhookFailureSpy = jasmine
      .createSpy('handleWebhookFailure')
      .and.callFake(() => {
        expect(validateWebhookUrlSpy).toHaveBeenCalled()
        expect(next).toHaveBeenCalled()
        done()
      })
    const controller = spec(controllerPath, {
      [validateWebhookUrlPath]: {
        validateWebhookUrl: validateWebhookUrlSpy,
      },
      [webhookUtilsPath]: {
        handleWebhookFailure: handleWebhookFailureSpy,
      },
    })
    controller.post(req, res, next)
  })

  // Mock the validateWebhookUrl function to resolve, and axios POST to
  // return 403. Expect validateWebhookUrl, failure handler and next to
  // have been called.
  it('should call the error handler if webhook POST fails', (done) => {
    req.form.webhook.url = 'https://staging.form.gov.sg/test/1'
    const validateWebhookUrlSpy = jasmine
      .createSpy('validateWebhookUrl')
      .and.callFake(() => Promise.resolve())
    mockAxios.onPost(req.form.webhook.url).reply(FORBIDDEN)
    const handleWebhookFailureSpy = jasmine
      .createSpy('handleWebhookFailure')
      .and.callFake(() => {
        expect(validateWebhookUrlSpy).toHaveBeenCalled()
        expect(next).toHaveBeenCalled()
        done()
      })
    const controller = spec(controllerPath, {
      [validateWebhookUrlPath]: {
        validateWebhookUrl: validateWebhookUrlSpy,
      },
      [webhookUtilsPath]: {
        handleWebhookFailure: handleWebhookFailureSpy,
      },
    })
    controller.post(req, res, next)
  })

  // Mock the validateWebhookUrl function to resolve, and axios POST to
  // return 200. Expect validateWebhookUrl, success handler and next to
  // have been called.
  it('should call the success handler if webhook POST succeeds', (done) => {
    req.form.webhook.url = 'https://staging.form.gov.sg/test/2'
    const validateWebhookUrlSpy = jasmine
      .createSpy('validateWebhookUrl')
      .and.callFake(() => Promise.resolve())
    mockAxios.onPost(req.form.webhook.url).reply(OK)
    const handleWebhookSuccessSpy = jasmine
      .createSpy('handleWebhookFailure')
      .and.callFake(() => {
        expect(validateWebhookUrlSpy).toHaveBeenCalled()
        expect(next).toHaveBeenCalled()
        done()
      })
    const controller = spec(controllerPath, {
      [validateWebhookUrlPath]: {
        validateWebhookUrl: validateWebhookUrlSpy,
      },
      [webhookUtilsPath]: {
        handleWebhookSuccess: handleWebhookSuccessSpy,
      },
    })
    controller.post(req, res, next)
  })

  it('should log and return if form has webhookUrl but submission is type emailSubmission', async () => {
    // Arrange
    const formId = mongoose.Types.ObjectId('000000000001')
    req.submission = await Submission.create({
      submissionType: 'emailSubmission',
      form: formId,
      responseHash: 'hash',
      responseSalt: 'salt',
    })

    const validateWebhookUrlSpy = jasmine.createSpy('validateWebhookUrl')
    const controller = spec(controllerPath, {
      [validateWebhookUrlPath]: {
        validateWebhookUrl: validateWebhookUrlSpy,
      },
    })

    // Act
    await controller.post(req, res, next)

    expect(validateWebhookUrlSpy).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should post webhook after validating url', () => {
    const MOCK_WEBHOOK_URL = 'https://staging.form.gov.sg/test/2'
    req.form.webhook.url = MOCK_WEBHOOK_URL
    const validateWebhookUrlSpy = jasmine
      .createSpy('validateWebhookUrl')
      .and.callFake(() => Promise.resolve())
    mockAxios.onPost(req.form.webhook.url).reply(OK)
    const postWebhookSpy = jasmine
      .createSpy('postWebhook')
      .and.callFake((actualWebhookParams) => {
        // Assert shape
        expect(actualWebhookParams.submissionId).toEqual(
          actualWebhookParams.submissionWebhookView.data.submissionId,
        )
        expect(actualWebhookParams.formId).toEqual(
          actualWebhookParams.submissionWebhookView.data.formId,
        )

        expect(actualWebhookParams).toEqual({
          webhookUrl: MOCK_WEBHOOK_URL,
          submissionWebhookView: {
            data: {
              formId: jasmine.any(String),
              submissionId: jasmine.any(String),
              encryptedContent: req.submission.encryptedContent,
              verifiedContent: req.submission.verifiedContent,
              version: req.submission.version,
              created: jasmine.any(Date),
            },
          },
          submissionId: jasmine.any(String),
          formId: jasmine.any(String),
          now: jasmine.any(Number),
          signature: jasmine.any(String),
        })
      })
    const controller = spec(controllerPath, {
      [validateWebhookUrlPath]: {
        validateWebhookUrl: validateWebhookUrlSpy,
      },
      [webhookUtilsPath]: {
        postWebhook: postWebhookSpy,
      },
    })
    controller.post(req, res, next)
  })
})

// Creates a req object with the default info needed
// for a webhook
const getDefaultReq = async (webhookUrl = defaultWebhookUrl) => {
  const formId = mongoose.Types.ObjectId('000000000001')
  const submission = await Submission.create({
    submissionType: 'encryptSubmission',
    form: formId,
    encryptedContent: 'encryptedContent',
    version: 1,
  })
  const form = {
    _id: formId,
    webhook: { url: webhookUrl },
  }
  return { form, submission }
}
