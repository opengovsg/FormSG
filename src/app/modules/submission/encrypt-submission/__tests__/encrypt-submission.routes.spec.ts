import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import session, { Session } from 'supertest-session'
import { mocked } from 'ts-jest/utils'

import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormAuthType, FormStatus } from '../../../../../../shared/types'
import { EncryptSubmissionRouter } from '../encrypt-submission.routes'

jest.mock('@opengovsg/spcp-auth-client')
const MockAuthClient = mocked(SPCPAuthClient, true)

const SUBMISSIONS_ENDPT_BASE = '/v2/submissions/encrypt'

const MOCK_ENCRYPTED_CONTENT = `${'a'.repeat(44)};${'a'.repeat(
  32,
)}:${'a'.repeat(4)}`
const MOCK_SUBMISSION_BODY = {
  responses: [],
  encryptedContent: MOCK_ENCRYPTED_CONTENT,
  version: 1,
}

const EncryptSubmissionsApp = setupApp(
  SUBMISSIONS_ENDPT_BASE,
  EncryptSubmissionRouter,
)

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
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
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
