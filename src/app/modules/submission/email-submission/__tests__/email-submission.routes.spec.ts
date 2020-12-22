import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import { celebrate, Joi } from 'celebrate'
import { RequestHandler, Router } from 'express'
import { omit } from 'lodash'
import session, { Session } from 'supertest-session'
import { mocked } from 'ts-jest/utils'

import * as FormController from 'src/app/controllers/forms.server.controller'
import * as MyInfoController from 'src/app/controllers/myinfo.server.controller'
import * as SubmissionsController from 'src/app/controllers/submissions.server.controller'
import * as PublicFormMiddleware from 'src/app/modules/form/public-form/public-form.middlewares'
import * as SpcpController from 'src/app/modules/spcp/spcp.controller'
import * as EmailSubmissionsMiddleware from 'src/app/modules/submission/email-submission/email-submission.middleware'
import { CaptchaFactory } from 'src/app/services/captcha/captcha.factory'
import * as CaptchaMiddleware from 'src/app/services/captcha/captcha.middleware'
import { AuthType, BasicField, IFieldSchema, Status } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import {
  MOCK_ATTACHMENT_FIELD,
  MOCK_ATTACHMENT_RESPONSE,
  MOCK_CHECKBOX_FIELD,
  MOCK_CHECKBOX_RESPONSE,
  MOCK_NO_RESPONSES_BODY,
  MOCK_OPTIONAL_VERIFIED_FIELD,
  MOCK_OPTIONAL_VERIFIED_RESPONSE,
  MOCK_SECTION_FIELD,
  MOCK_SECTION_RESPONSE,
  MOCK_TEXT_FIELD,
  MOCK_TEXTFIELD_RESPONSE,
} from './email-submission.test.constants'

jest.mock('@opengovsg/spcp-auth-client')
const MockAuthClient = mocked(SPCPAuthClient, true)
const mockSpClient = mocked(MockAuthClient.mock.instances[0], true)
const mockCpClient = mocked(MockAuthClient.mock.instances[1], true)

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
}))

// TODO (#149): Import router instead of creating it here
const SUBMISSIONS_ENDPT_BASE = '/v2/submissions/email'
const SUBMISSIONS_ENDPT = `${SUBMISSIONS_ENDPT_BASE}/:formId([a-fA-F0-9]{24})`

const EmailSubmissionsRouter = Router()
EmailSubmissionsRouter.post(
  SUBMISSIONS_ENDPT,
  CaptchaFactory.validateCaptchaParams,
  FormController.formById,
  PublicFormMiddleware.isFormPublicCheck,
  CaptchaMiddleware.checkCaptchaResponse as RequestHandler,
  SpcpController.isSpcpAuthenticated,
  EmailSubmissionsMiddleware.receiveEmailSubmission,
  celebrate({
    body: Joi.object({
      responses: Joi.array()
        .items(
          Joi.object()
            .keys({
              _id: Joi.string().required(),
              // Question is optional in anticipation of the same change
              // when merging middlewares into controller
              question: Joi.string(),
              fieldType: Joi.string()
                .required()
                .valid(...Object.values(BasicField)),
              answer: Joi.string().allow(''),
              answerArray: Joi.array(),
              filename: Joi.string(),
              content: Joi.binary(),
              isHeader: Joi.boolean(),
              myInfo: Joi.object(),
              signature: Joi.string().allow(''),
            })
            .xor('answer', 'answerArray') // only answer or answerArray can be present at once
            .with('filename', 'content'), // if filename is present, content must be present
        )
        .required(),
      isPreview: Joi.boolean().required(),
    }),
  }),
  EmailSubmissionsMiddleware.validateEmailSubmission,
  MyInfoController.verifyMyInfoVals as RequestHandler,
  (SubmissionsController.injectAutoReplyInfo as unknown) as RequestHandler,
  SpcpController.appendVerifiedSPCPResponses as RequestHandler,
  EmailSubmissionsMiddleware.prepareEmailSubmission as RequestHandler,
  EmailSubmissionsMiddleware.saveMetadataToDb,
  EmailSubmissionsMiddleware.sendAdminEmail,
  SubmissionsController.sendAutoReply,
)

const EmailSubmissionsApp = setupApp('/', EmailSubmissionsRouter)

describe('email-submission.routes', () => {
  let request: Session

  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => {
    request = session(EmailSubmissionsApp)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Joi validation', () => {
    it('should return 200 when submission is valid', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
          form_fields: [MOCK_TEXT_FIELD],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        // MOCK_RESPONSE contains all required keys
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [MOCK_TEXTFIELD_RESPONSE],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 200 when answer is empty string for optional field', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
          form_fields: [
            { ...MOCK_TEXT_FIELD, required: false } as IFieldSchema,
          ],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [{ ...MOCK_TEXTFIELD_RESPONSE, answer: '' }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 200 when attachment response has filename and content', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
          form_fields: [MOCK_ATTACHMENT_FIELD],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [
              {
                ...MOCK_ATTACHMENT_RESPONSE,
                content: MOCK_ATTACHMENT_RESPONSE.content.toString('binary'),
              },
            ],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 200 when response has isHeader key', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
          form_fields: [MOCK_SECTION_FIELD],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [{ ...MOCK_SECTION_RESPONSE, isHeader: true }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 200 when signature is empty string for optional verified field', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
          form_fields: [MOCK_OPTIONAL_VERIFIED_FIELD],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [{ ...MOCK_OPTIONAL_VERIFIED_RESPONSE, signature: '' }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 200 when response has answerArray and no answer', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
          form_fields: [MOCK_CHECKBOX_FIELD],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [MOCK_CHECKBOX_RESPONSE],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 400 when isPreview key is missing', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        // Note missing isPreview
        .field('body', JSON.stringify({ responses: [] }))
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual(
        'celebrate request validation failed',
      )
    })

    it('should return 400 when responses key is missing', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        // Note missing responses
        .field('body', JSON.stringify({ isPreview: false }))
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual(
        'celebrate request validation failed',
      )
    })

    it('should return 400 when response is missing _id', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [omit(MOCK_TEXTFIELD_RESPONSE, '_id')],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual(
        'celebrate request validation failed',
      )
    })

    it('should return 400 when response is missing fieldType', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [omit(MOCK_TEXTFIELD_RESPONSE, 'fieldType')],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual(
        'celebrate request validation failed',
      )
    })

    it('should return 400 when response has invalid fieldType', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [
              { ...MOCK_TEXTFIELD_RESPONSE, fieldType: 'definitelyInvalid' },
            ],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual(
        'celebrate request validation failed',
      )
    })

    it('should return 400 when response is missing answer', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [omit(MOCK_TEXTFIELD_RESPONSE, 'answer')],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual(
        'celebrate request validation failed',
      )
    })

    it('should return 400 when response has both answer and answerArray', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [{ ...MOCK_TEXTFIELD_RESPONSE, answerArray: [] }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual(
        'celebrate request validation failed',
      )
    })

    it('should return 400 when attachment response has filename but not content', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [omit(MOCK_ATTACHMENT_RESPONSE), 'content'],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual(
        'celebrate request validation failed',
      )
    })

    it('should return 400 when attachment response has content but not filename', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: Status.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            isPreview: false,
            responses: [omit(MOCK_ATTACHMENT_RESPONSE), 'filename'],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual(
        'celebrate request validation failed',
      )
    })
  })

  describe('SPCP authentication', () => {
    describe('SingPass', () => {
      it('should return 200 when submission is valid', async () => {
        mockSpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
          cb(null, {
            userName: 'S1234567A',
          }),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.SP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', ['jwtSp=mockJwt'])

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
        })
      })

      it('should return 401 when submission does not have JWT', async () => {
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.SP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
        // Note cookie is not set

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has the wrong JWT type', async () => {
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.SP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          // Note cookie is for CorpPass, not SingPass
          .set('Cookie', ['jwtCp=mockJwt'])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has invalid JWT', async () => {
        // Mock auth client to return error when decoding JWT
        mockSpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
          cb(new Error()),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.SP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', ['jwtSp=mockJwt'])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has JWT with the wrong shape', async () => {
        // Mock auth client to return wrong decoded shape
        mockSpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
          cb(null, {
            wrongKey: 'S1234567A',
          }),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.SP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', ['jwtSp=mockJwt'])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })
    })

    describe('CorpPass', () => {
      it('should return 200 when submission is valid', async () => {
        mockCpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
          cb(null, {
            userName: 'S1234567A',
            userInfo: 'MyCorpPassUEN',
          }),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.CP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', ['jwtCp=mockJwt'])

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
        })
      })

      it('should return 401 when submission does not have JWT', async () => {
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.CP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
        // Note cookie is not set

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has the wrong JWT type', async () => {
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.CP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          // Note cookie is for SingPass, not CorpPass
          .set('Cookie', ['jwtSp=mockJwt'])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has invalid JWT', async () => {
        // Mock auth client to return error when decoding JWT
        mockCpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
          cb(new Error()),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.CP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', ['jwtCp=mockJwt'])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has JWT with the wrong shape', async () => {
        // Mock auth client to return wrong decoded JWT shape
        mockCpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
          cb(null, {
            wrongKey: 'S1234567A',
          }),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.CP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', ['jwtCp=mockJwt'])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })
    })
  })
})
