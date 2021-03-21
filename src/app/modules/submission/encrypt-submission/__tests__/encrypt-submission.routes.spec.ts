import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import { celebrate, Joi } from 'celebrate'
import { RequestHandler, Router } from 'express'
import session, { Session } from 'supertest-session'
import { mocked } from 'ts-jest/utils'

import * as encryptSubmissions from 'src/app/controllers/encrypt-submissions.server.controller'
import * as FormController from 'src/app/controllers/forms.server.controller'
import * as webhookVerifiedContentFactory from 'src/app/factories/webhook-verified-content.factory'
import * as EncryptSubmissionsMiddleware from 'src/app/modules/submission/encrypt-submission/encrypt-submission.middleware'
import * as SubmissionsMiddleware from 'src/app/modules/submission/submission.middleware'
import * as VerifiedContentMiddleware from 'src/app/modules/verified-content/verified-content.middlewares'
import { CaptchaFactory } from 'src/app/services/captcha/captcha.factory'
import { AuthType, BasicField, Status } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

jest.mock('@opengovsg/spcp-auth-client')
const MockAuthClient = mocked(SPCPAuthClient, true)

// TODO (#149): Import router instead of creating it here
const SUBMISSIONS_ENDPT_BASE = '/v2/submissions/encrypt'
const SUBMISSIONS_ENDPT = `${SUBMISSIONS_ENDPT_BASE}/:formId([a-fA-F0-9]{24})`

const MOCK_ENCRYPTED_CONTENT = `${'a'.repeat(44)};${'a'.repeat(
  32,
)}:${'a'.repeat(4)}`
const MOCK_SUBMISSION_BODY = {
  responses: [],
  encryptedContent: MOCK_ENCRYPTED_CONTENT,
  isPreview: false,
  version: 1,
}

// TODO (#149): Import router instead of creating it here
const EncryptSubmissionsRouter = Router()
EncryptSubmissionsRouter.post(
  SUBMISSIONS_ENDPT,
  CaptchaFactory.validateCaptchaParams,
  celebrate({
    body: Joi.object({
      responses: Joi.array()
        .items(
          Joi.object().keys({
            _id: Joi.string().required(),
            answer: Joi.string().allow('').required(),
            fieldType: Joi.string()
              .required()
              .valid(...Object.values(BasicField)),
            signature: Joi.string().allow(''),
          }),
        )
        .required(),
      encryptedContent: Joi.string()
        .custom((value, helpers) => {
          const parts = String(value).split(/;|:/)
          if (
            parts.length !== 3 ||
            parts[0].length !== 44 || // public key
            parts[1].length !== 32 || // nonce
            !parts.every((part) => Joi.string().base64().validate(part))
          ) {
            return helpers.error('Invalid encryptedContent.')
          }
          return value
        }, 'encryptedContent')
        .required(),
      attachments: Joi.object()
        .pattern(
          /^[a-fA-F0-9]{24}$/,
          Joi.object().keys({
            encryptedFile: Joi.object().keys({
              binary: Joi.string().required(),
              nonce: Joi.string().required(),
              submissionPublicKey: Joi.string().required(),
            }),
          }),
        )
        .optional(),
      isPreview: Joi.boolean().required(),
      version: Joi.number().required(),
    }),
  }),
  FormController.formById,
  EncryptSubmissionsMiddleware.validateAndProcessEncryptSubmission,
  VerifiedContentMiddleware.encryptVerifiedSpcpFields,
  EncryptSubmissionsMiddleware.prepareEncryptSubmission as RequestHandler,
  (encryptSubmissions.saveResponseToDb as unknown) as RequestHandler,
  webhookVerifiedContentFactory.post as RequestHandler,
  SubmissionsMiddleware.sendEmailConfirmations as RequestHandler,
)

const EncryptSubmissionsApp = setupApp('/', EncryptSubmissionsRouter)

describe('encrypt-submission.routes', () => {
  let request: Session
  const mockSpClient = mocked(MockAuthClient.mock.instances[0], true)
  const mockCpClient = mocked(MockAuthClient.mock.instances[1], true)

  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => {
    request = session(EncryptSubmissionsApp)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('SPCP authentication', () => {
    describe('SingPass', () => {
      it('should return 200 when submission is valid', async () => {
        mockSpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
          cb(null, {
            userName: 'S1234567A',
          }),
        )
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.SP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
          .query({ captchaResponse: 'null' })
          .set('Cookie', ['jwtSp=mockJwt'])

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
        })
      })

      it('should return 401 when submission does not have JWT', async () => {
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.SP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.SP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
          .query({ captchaResponse: 'null' })
          .set('Cookie', ['jwtCp=mockJwt'])
        // Note cookie is for CorpPass, not SingPass

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
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.SP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
        // Mock auth client to return wrong decoded JWT shape
        mockSpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
          cb(null, {
            wrongKey: 'S1234567A',
          }),
        )
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.SP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.CP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
          .query({ captchaResponse: 'null' })
          .set('Cookie', ['jwtCp=mockJwt'])

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
        })
      })

      it('should return 401 when submission does not have JWT', async () => {
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.CP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.CP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.CP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: AuthType.CP,
            hasCaptcha: false,
            status: Status.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
