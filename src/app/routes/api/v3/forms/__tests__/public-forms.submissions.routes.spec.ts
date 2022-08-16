import MyInfoClient, { IMyInfoConfig } from '@opengovsg/myinfo-gov-client'
import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import { omit } from 'lodash'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'
import { mocked } from 'ts-jest/utils'

import { MYINFO_COOKIE_NAME } from 'src/app/modules/myinfo/myinfo.constants'
import { MyInfoCookieState } from 'src/app/modules/myinfo/myinfo.types'
import getMyInfoHashModel from 'src/app/modules/myinfo/myinfo_hash.model'
import { FormFieldSchema } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormAuthType, FormStatus } from '../../../../../../../shared/types'
import { SpOidcClient } from '../../../../../modules/spcp/sp.oidc.client'
import { PublicFormsRouter } from '../public-forms.routes'

import {
  MOCK_ATTACHMENT_FIELD,
  MOCK_ATTACHMENT_RESPONSE,
  MOCK_CHECKBOX_FIELD,
  MOCK_CHECKBOX_RESPONSE,
  MOCK_COOKIE_AGE,
  MOCK_NO_RESPONSES_BODY,
  MOCK_OPTIONAL_VERIFIED_FIELD,
  MOCK_OPTIONAL_VERIFIED_RESPONSE,
  MOCK_SECTION_FIELD,
  MOCK_SECTION_RESPONSE,
  MOCK_TEXT_FIELD,
  MOCK_TEXTFIELD_RESPONSE,
  MOCK_UINFIN,
} from './public-forms.routes.spec.constants'

const MyInfoHashModel = getMyInfoHashModel(mongoose)

jest.mock('@opengovsg/spcp-auth-client')
jest.mock('../../../../../modules/spcp/sp.oidc.client')
const MockAuthClient = mocked(SPCPAuthClient, true)

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))

jest.mock('@opengovsg/myinfo-gov-client', () => {
  return {
    MyInfoGovClient: jest.fn().mockReturnValue({
      extractUinFin: jest.fn(),
      getPerson: jest.fn(),
    }),
    MyInfoMode: jest.requireActual('@opengovsg/myinfo-gov-client').MyInfoMode,
    MyInfoSource: jest.requireActual('@opengovsg/myinfo-gov-client')
      .MyInfoSource,
    MyInfoAddressType: jest.requireActual('@opengovsg/myinfo-gov-client')
      .MyInfoAddressType,
    MyInfoAttribute: jest.requireActual('@opengovsg/myinfo-gov-client')
      .MyInfoAttribute,
  }
})

const MockMyInfoGovClient = mocked(
  new MyInfoClient.MyInfoGovClient({} as IMyInfoConfig),
  true,
)

const app = setupApp('/forms', PublicFormsRouter)

describe('public-form.submissions.routes', () => {
  let request: Session

  const mockCpClient = mocked(MockAuthClient.mock.instances[1], true)

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('POST /forms/:formId/submissions/email', () => {
    const mockCpClient = mocked(MockAuthClient.mock.instances[1], true)

    describe('Joi validation', () => {
      it('should return 200 when submission is valid', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
            form_fields: [MOCK_TEXT_FIELD],
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          // MOCK_RESPONSE contains all required keys
          .field(
            'body',
            JSON.stringify({
              responses: [MOCK_TEXTFIELD_RESPONSE],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
        })
      })

      it('should return 200 when answer is empty string for optional field', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
            form_fields: [
              { ...MOCK_TEXT_FIELD, required: false } as FormFieldSchema,
            ],
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [{ ...MOCK_TEXTFIELD_RESPONSE, answer: '' }],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
        })
      })

      it('should return 200 when attachment response has filename and content', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
            form_fields: [MOCK_ATTACHMENT_FIELD],
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
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

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
        })
      })

      it('should return 200 when response has isHeader key', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
            form_fields: [MOCK_SECTION_FIELD],
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [{ ...MOCK_SECTION_RESPONSE, isHeader: true }],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
        })
      })

      it('should return 200 when signature is empty string for optional verified field', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
            form_fields: [MOCK_OPTIONAL_VERIFIED_FIELD],
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [
                { ...MOCK_OPTIONAL_VERIFIED_RESPONSE, signature: '' },
              ],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
        })
      })

      it('should return 200 when response has answerArray and no answer', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
            form_fields: [MOCK_CHECKBOX_FIELD],
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [MOCK_CHECKBOX_RESPONSE],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
        })
      })

      it('should return 400 when responses key is missing', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          // Note missing responses
          .field('body', JSON.stringify({}))
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when response is missing _id', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [omit(MOCK_TEXTFIELD_RESPONSE, '_id')],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when response is missing fieldType', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [omit(MOCK_TEXTFIELD_RESPONSE, 'fieldType')],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when response has invalid fieldType', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [
                { ...MOCK_TEXTFIELD_RESPONSE, fieldType: 'definitelyInvalid' },
              ],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when response is missing answer', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [omit(MOCK_TEXTFIELD_RESPONSE, 'answer')],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when response has both answer and answerArray', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [{ ...MOCK_TEXTFIELD_RESPONSE, answerArray: [] }],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when attachment response has filename but not content', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [omit(MOCK_ATTACHMENT_RESPONSE), 'content'],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when attachment response has content but not filename', async () => {
        // Arrange
        const { form } = await dbHandler.insertEmailForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/email`)
          .field(
            'body',
            JSON.stringify({
              responses: [omit(MOCK_ATTACHMENT_RESPONSE), 'filename'],
            }),
          )
          .query({ captchaResponse: 'null' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })
    })

    describe('SP, CP and MyInfo authentication', () => {
      describe('SingPass', () => {
        it('should return 200 when submission is valid', async () => {
          // Arrange
          jest
            .spyOn(SpOidcClient.prototype, 'verifyJwt')
            .mockResolvedValueOnce({
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

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            .set('Cookie', ['jwtSp=mockJwt'])

          // Assert
          expect(response.status).toBe(200)
          expect(response.body).toEqual({
            message: 'Form submission successful.',
            submissionId: expect.any(String),
          })
        })

        it('should return 401 when submission does not have JWT', async () => {
          // Arrange
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
          // Note cookie is not set

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has the wrong JWT type', async () => {
          // Arrange
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            // Note cookie is for CorpPass, not SingPass
            .set('Cookie', ['jwtCp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has invalid JWT', async () => {
          // Arrange
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

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            .set('Cookie', ['jwtSp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has JWT with the wrong shape', async () => {
          // Arrange
          // Mock auth client to return wrong decoded shape
          jest
            .spyOn(SpOidcClient.prototype, 'verifyJwt')
            .mockResolvedValueOnce({
              wrongKey: 'S1234567A',
            })

          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            .set('Cookie', ['jwtSp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            spcpSubmissionFailure: true,
          })
        })
      })

      describe('MyInfo', () => {
        it('should return 200 when submission is valid', async () => {
          // Arrange
          MockMyInfoGovClient.extractUinFin.mockReturnValueOnce(MOCK_UINFIN)
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.MyInfo,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })
          const cookie = JSON.stringify({
            accessToken: 'mockAccessToken',
            usedCount: 0,
            state: MyInfoCookieState.Success,
          })
          await MyInfoHashModel.updateHashes(
            MOCK_UINFIN,
            form._id,
            {},
            MOCK_COOKIE_AGE,
          )

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            .set('Cookie', [
              // The j: indicates that the cookie is in JSON
              `${MYINFO_COOKIE_NAME}=j:${encodeURIComponent(cookie)}`,
            ])

          // Assert
          expect(response.status).toBe(200)
          expect(response.body).toEqual({
            message: 'Form submission successful.',
            submissionId: expect.any(String),
          })
        })

        it('should return 401 when submission is missing MyInfo cookie', async () => {
          // Arrange
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.MyInfo,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
          // Note cookie is not set

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has the wrong cookie type', async () => {
          // Arrange
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.MyInfo,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            // Note cookie is for SingPass, not MyInfo
            .set('Cookie', ['jwtSp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has invalid cookie', async () => {
          // Arrange
          // Mock MyInfoGovClient to return error when decoding JWT
          MockMyInfoGovClient.extractUinFin.mockImplementationOnce(() => {
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
          const cookie = JSON.stringify({
            accessToken: 'mockAccessToken',
            usedCount: 0,
            state: MyInfoCookieState.Success,
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            .set('Cookie', [
              // The j: indicates that the cookie is in JSON
              `${MYINFO_COOKIE_NAME}=j:${encodeURIComponent(cookie)}`,
            ])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has cookie with the wrong shape', async () => {
          // Arrange
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })
          const cookie = JSON.stringify({
            accessToken: 'mockAccessToken',
            usedCount: 0,
            // Note that state is set to Error instead of Success
            state: MyInfoCookieState.Error,
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            .set('Cookie', [
              // The j: indicates that the cookie is in JSON
              `${MYINFO_COOKIE_NAME}=j:${encodeURIComponent(cookie)}`,
            ])

          // Assert
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
          // Arrange
          mockCpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
            cb(null, {
              userName: 'S1234567A',
              userInfo: 'MyCorpPassUEN',
            }),
          )
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            .set('Cookie', ['jwtCp=mockJwt'])

          // Assert
          expect(response.status).toBe(200)
          expect(response.body).toEqual({
            message: 'Form submission successful.',
            submissionId: expect.any(String),
          })
        })

        it('should return 401 when submission does not have JWT', async () => {
          // Arrange
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
          // Note cookie is not set

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has the wrong JWT type', async () => {
          // Arrange
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            // Note cookie is for SingPass, not CorpPass
            .set('Cookie', ['jwtSp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has invalid JWT', async () => {
          // Arrange
          // Mock auth client to return error when decoding JWT
          mockCpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
            cb(new Error()),
          )
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            .set('Cookie', ['jwtCp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has JWT with the wrong shape', async () => {
          // Arrange
          // Mock auth client to return wrong decoded JWT shape
          mockCpClient.verifyJWT.mockImplementationOnce((_jwt, cb) =>
            cb(null, {
              wrongKey: 'S1234567A',
            }),
          )
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/email`)
            .field('body', JSON.stringify(MOCK_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null' })
            .set('Cookie', ['jwtCp=mockJwt'])

          // Assert
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

  describe('POST /forms/:formId/submissions/encrypt', () => {
    const MOCK_ENCRYPTED_CONTENT = `${'a'.repeat(44)};${'a'.repeat(
      32,
    )}:${'a'.repeat(4)}`
    const MOCK_SUBMISSION_BODY = {
      responses: [],
      encryptedContent: MOCK_ENCRYPTED_CONTENT,

      version: 1,
    }
    describe('SPCP authentication', () => {
      describe('SingPass', () => {
        it('should return 200 when submission is valid', async () => {
          jest
            .spyOn(SpOidcClient.prototype, 'verifyJwt')
            .mockResolvedValueOnce({
              userName: 'S1234567A',
            })
          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          const response = await request
            .post(`/forms/${form._id}/submissions/encrypt`)
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
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          const response = await request
            .post(`/forms/${form._id}/submissions/encrypt`)
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
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          const response = await request
            .post(`/forms/${form._id}/submissions/encrypt`)
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
          jest
            .spyOn(SpOidcClient.prototype, 'verifyJwt')
            .mockRejectedValueOnce(new Error())

          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          const response = await request
            .post(`/forms/${form._id}/submissions/encrypt`)
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
          jest
            .spyOn(SpOidcClient.prototype, 'verifyJwt')
            .mockResolvedValueOnce({
              wrongKey: 'S1234567A',
            })

          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          const response = await request
            .post(`/forms/${form._id}/submissions/encrypt`)
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
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          const response = await request
            .post(`/forms/${form._id}/submissions/encrypt`)
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
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          const response = await request
            .post(`/forms/${form._id}/submissions/encrypt`)
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
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          const response = await request
            .post(`/forms/${form._id}/submissions/encrypt`)
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
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          const response = await request
            .post(`/forms/${form._id}/submissions/encrypt`)
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
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          const response = await request
            .post(`/forms/${form._id}/submissions/encrypt`)
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
})
