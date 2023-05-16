import jwt from 'jsonwebtoken'
import { omit } from 'lodash'
import mongoose from 'mongoose'
import { err, ok } from 'neverthrow'
import session, { Session } from 'supertest-session'

import { SGIDMyInfoData } from 'src/app/modules/sgid/sgid.adapter'
import { FormFieldSchema } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormAuthType, FormStatus } from '../../../../../../shared/types'
import {
  MOCK_COOKIE_AGE,
  MOCK_MYINFO_JWT,
  MOCK_UINFIN,
} from '../../../myinfo/__tests__/myinfo.test.constants'
import { MYINFO_LOGIN_COOKIE_NAME } from '../../../myinfo/myinfo.constants'
import getMyInfoHashModel from '../../../myinfo/myinfo_hash.model'
import { SGID_COOKIE_NAME } from '../../../sgid/sgid.constants'
import {
  SgidInvalidJwtError,
  SgidMissingJwtError,
} from '../../../sgid/sgid.errors'
import { SgidService } from '../../../sgid/sgid.service'
import { CpOidcClient, SpOidcClient } from '../../../spcp/spcp.oidc.client'
// Import last so mocks are imported correctly
// eslint-disable-next-line import/first
import { EmailSubmissionRouter } from '../email-submission.routes'

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

const MyInfoHashModel = getMyInfoHashModel(mongoose)
jest.mock('../../../sgid/sgid.service')

const MockSgidService = jest.mocked(SgidService)
const MockCpOidcClient = jest.mocked(CpOidcClient)

jest.mock('../../../spcp/spcp.oidc.client')

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))

jest.mock('@opengovsg/myinfo-gov-client', () => ({
  MyInfoGovClient: jest.fn().mockReturnValue({
    extractUinFin: jest.fn(),
  }),
  MyInfoMode: jest.requireActual('@opengovsg/myinfo-gov-client').MyInfoMode,
  MyInfoSource: jest.requireActual('@opengovsg/myinfo-gov-client').MyInfoSource,
  MyInfoAddressType: jest.requireActual('@opengovsg/myinfo-gov-client')
    .MyInfoAddressType,
  MyInfoAttribute: jest.requireActual('@opengovsg/myinfo-gov-client')
    .MyInfoAttribute,
}))

const SUBMISSIONS_ENDPT_BASE = '/v2/submissions/email'

const EmailSubmissionsApp = setupApp(
  SUBMISSIONS_ENDPT_BASE,
  EmailSubmissionRouter,
)

describe('email-submission.routes', () => {
  let request: Session

  const mockCpClient = jest.mocked(MockCpOidcClient.mock.instances[0])

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
          status: FormStatus.Public,
          form_fields: [MOCK_TEXT_FIELD],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        // MOCK_RESPONSE contains all required keys
        .field(
          'body',
          JSON.stringify({
            responses: [MOCK_TEXTFIELD_RESPONSE],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
        timestamp: expect.any(Number),
      })
    })

    it('should return 200 when answer is empty string for optional field', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [
            { ...MOCK_TEXT_FIELD, required: false } as FormFieldSchema,
          ],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [{ ...MOCK_TEXTFIELD_RESPONSE, answer: '' }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
        timestamp: expect.any(Number),
      })
    })

    it('should return 200 when attachment response has filename and content', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [MOCK_ATTACHMENT_FIELD],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
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
        timestamp: expect.any(Number),
      })
    })

    it('should return 200 when response has isHeader key', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [MOCK_SECTION_FIELD],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [{ ...MOCK_SECTION_RESPONSE, isHeader: true }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
        timestamp: expect.any(Number),
      })
    })

    it('should return 200 when signature is empty string for optional verified field', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [MOCK_OPTIONAL_VERIFIED_FIELD],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [{ ...MOCK_OPTIONAL_VERIFIED_RESPONSE, signature: '' }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
        timestamp: expect.any(Number),
      })
    })

    it('should return 200 when response has answerArray and no answer', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [MOCK_CHECKBOX_FIELD],
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [MOCK_CHECKBOX_RESPONSE],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
        timestamp: expect.any(Number),
      })
    })

    it('should return 400 when responses key is missing', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        // Note missing responses
        .field('body', JSON.stringify({}))
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when response is missing _id', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [omit(MOCK_TEXTFIELD_RESPONSE, '_id')],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when response is missing fieldType', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [omit(MOCK_TEXTFIELD_RESPONSE, 'fieldType')],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when response has invalid fieldType', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [
              { ...MOCK_TEXTFIELD_RESPONSE, fieldType: 'definitelyInvalid' },
            ],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when response is missing answer', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [omit(MOCK_TEXTFIELD_RESPONSE, 'answer')],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when response has both answer and answerArray', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [{ ...MOCK_TEXTFIELD_RESPONSE, answerArray: [] }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when attachment response has filename but not content', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [omit(MOCK_ATTACHMENT_RESPONSE), 'content'],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when attachment response has content but not filename', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
        .field(
          'body',
          JSON.stringify({
            responses: [omit(MOCK_ATTACHMENT_RESPONSE), 'filename'],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })
  })

  describe('SP, CP, SGID and MyInfo authentication', () => {
    describe('SingPass', () => {
      it('should return 200 when submission is valid', async () => {
        jest.spyOn(SpOidcClient.prototype, 'verifyJwt').mockResolvedValueOnce({
          userName: 'S1234567A',
        })

        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
          timestamp: expect.any(Number),
        })
      })

      it('should return 401 when submission does not have JWT', async () => {
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
        jest
          .spyOn(SpOidcClient.prototype, 'verifyJwt')
          .mockRejectedValueOnce(new Error())

        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
        jest.spyOn(SpOidcClient.prototype, 'verifyJwt').mockResolvedValueOnce({
          wrongKey: 'S1234567A', // Expect `userName` property
        })

        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
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

    describe('MyInfo', () => {
      afterEach(() => jest.restoreAllMocks())

      it('should return 200 when submission is valid', async () => {
        // Arrange
        // Ignore TS errors as .verify has multiple overloads
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        jest.spyOn(jwt, 'verify').mockReturnValueOnce({ uinFin: MOCK_UINFIN })
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.MyInfo,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })
        await MyInfoHashModel.updateHashes(
          MOCK_UINFIN,
          form._id,
          {},
          MOCK_COOKIE_AGE,
        )

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', [
            // The j: indicates that the cookie is in JSON
            `${MYINFO_LOGIN_COOKIE_NAME}=${MOCK_MYINFO_JWT}`,
          ])

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
          timestamp: expect.any(Number),
        })
      })

      it('should return 401 when submission is missing MyInfo cookie', async () => {
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.MyInfo,
            hasCaptcha: false,
            status: FormStatus.Public,
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

      it('should return 401 when submission has the wrong cookie type', async () => {
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.MyInfo,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          // Note cookie is for SingPass, not MyInfo
          .set('Cookie', ['jwtSp=mockJwt'])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has invalid cookie', async () => {
        jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
          throw new Error()
        })
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.MyInfo,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', [
            // The j: indicates that the cookie is in JSON
            `${MYINFO_LOGIN_COOKIE_NAME}=${MOCK_MYINFO_JWT}`,
          ])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has cookie with the wrong shape', async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        jest.spyOn(jwt, 'verify').mockReturnValueOnce({ someKey: 'someValue' })
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.MyInfo,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', [
            // The j: indicates that the cookie is in JSON
            `${MYINFO_LOGIN_COOKIE_NAME}=${MOCK_MYINFO_JWT}`,
          ])

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
        mockCpClient.verifyJwt.mockResolvedValueOnce({
          userName: 'S1234567A',
          userInfo: 'MyCorpPassUEN',
        })
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
          timestamp: expect.any(Number),
        })
      })

      it('should return 401 when submission does not have JWT', async () => {
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
        mockCpClient.verifyJwt.mockRejectedValueOnce(new Error())

        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
        mockCpClient.verifyJwt.mockResolvedValueOnce({
          wrongKey: 'S1234567A',
        })
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
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

    describe('SGID', () => {
      it('should return 200 when submission is valid', async () => {
        MockSgidService.extractSgidJwtPayload.mockReturnValueOnce(
          ok(
            new SGIDMyInfoData({
              'myinfo.nric_number': 'S1234567A',
            }),
          ),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SGID,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', [`${SGID_COOKIE_NAME}=mockJwt`])

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
          timestamp: expect.any(Number),
        })
      })

      it('should return 401 when submission does not have JWT', async () => {
        MockSgidService.extractSgidJwtPayload.mockReturnValueOnce(
          err(new SgidMissingJwtError()),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SGID,
            hasCaptcha: false,
            status: FormStatus.Public,
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
        // Should be undefined, since there was no SGID cookie
        expect(MockSgidService.extractSgidJwtPayload).toHaveBeenLastCalledWith(
          undefined,
        )
      })

      it('should return 401 when submission has the wrong JWT type', async () => {
        MockSgidService.extractSgidJwtPayload.mockReturnValueOnce(
          err(new SgidMissingJwtError()),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SGID,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          // Note cookie is for SingPass, not SGID
          .set('Cookie', ['jwtSp=mockJwt'])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
        // Should be undefined, since there was no SGID cookie
        expect(MockSgidService.extractSgidJwtPayload).toHaveBeenLastCalledWith(
          undefined,
        )
      })

      it('should return 401 when submission has invalid JWT', async () => {
        MockSgidService.extractSgidJwtPayload.mockReturnValueOnce(
          err(new SgidInvalidJwtError()),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SGID,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', [`${SGID_COOKIE_NAME}=mockJwt`])

        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has JWT with the wrong shape', async () => {
        MockSgidService.extractSgidJwtPayload.mockReturnValueOnce(
          err(new SgidInvalidJwtError()),
        )
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SGID,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null' })
          .set('Cookie', [`${SGID_COOKIE_NAME}=mockJwt`])

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
