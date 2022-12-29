import { err, ok } from 'neverthrow'
import session, { Session } from 'supertest-session'

import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormAuthType, FormStatus } from '../../../../../../shared/types'
import { SGID_COOKIE_NAME } from '../../../sgid/sgid.constants'
import {
  SgidInvalidJwtError,
  SgidMissingJwtError,
} from '../../../sgid/sgid.errors'
import { SgidService } from '../../../sgid/sgid.service'
import { CpOidcClient, SpOidcClient } from '../../../spcp/spcp.oidc.client'
import { EncryptSubmissionRouter } from '../encrypt-submission.routes'

jest.mock('../../../sgid/sgid.service')

const MockSgidService = jest.mocked(SgidService)

jest.mock('../../../spcp/spcp.oidc.client')

const MockCpOidcClient = jest.mocked(CpOidcClient)

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

  const mockCpClient = jest.mocked(MockCpOidcClient.mock.instances[0])

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
        jest.spyOn(SpOidcClient.prototype, 'verifyJwt').mockResolvedValueOnce({
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
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
        // Mock SpOidc client to return error when decoding JWT
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
        jest.spyOn(SpOidcClient.prototype, 'verifyJwt').mockResolvedValueOnce({
          wrongKey: 'S1234567A', // Expects `userName` property
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
        mockCpClient.verifyJwt.mockResolvedValueOnce({
          userName: 'S1234567A',
          userInfo: 'MyCorpPassUEN',
        })
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
          timestamp: expect.any(Number),
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
        mockCpClient.verifyJwt.mockRejectedValueOnce(new Error())

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
        mockCpClient.verifyJwt.mockResolvedValueOnce({
          wrongKey: 'S1234567A',
        })
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

    describe('SGID', () => {
      beforeEach(() => {
        // Reset mocks
        jest.resetAllMocks()
      })
      it('should return 200 when submission is valid', async () => {
        MockSgidService.extractSgidJwtPayload.mockReturnValueOnce(
          ok({
            userName: 'S1234567A',
          }),
        )
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SGID,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SGID,
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
        // Should be undefined, since there was no SGID cookie
        expect(MockSgidService.extractSgidJwtPayload).toHaveBeenLastCalledWith(
          undefined,
        )
      })

      it('should return 401 when submission has the wrong JWT type', async () => {
        MockSgidService.extractSgidJwtPayload.mockReturnValueOnce(
          err(new SgidMissingJwtError()),
        )
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SGID,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SGID,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SGID,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        const response = await request
          .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
          .send(MOCK_SUBMISSION_BODY)
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
