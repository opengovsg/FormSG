import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import {
  ErrorCode,
  FormAuthType,
  FormStatus,
  SubmissionType,
} from 'formsg-shared/types'
import jwt from 'jsonwebtoken'
import { omit } from 'lodash'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'
import session, { Session } from 'supertest-session'

import getLoginModel from 'src/app/models/login.server.model'
import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import * as FeatureFlagsService from 'src/app/modules/feature-flags/feature-flags.service'
import * as FormService from 'src/app/modules/form/form.service'
import * as MyInfoFapiService from 'src/app/modules/myinfo/fapi/myinfo.fapi.service'
import { MyInfoData } from 'src/app/modules/myinfo/myinfo.adapter'
import * as stepToken from 'src/app/modules/submission/multirespondent-submission/step-token'
import { s3Operations } from 'src/app/utils/aws-s3'
import { FormFieldSchema } from 'src/types'

import {
  MOCK_COOKIE_AGE,
  MOCK_MYINFO_DATA,
  MOCK_MYINFO_JWT,
  MOCK_UINFIN,
} from '../../../../../modules/myinfo/__tests__/myinfo.test.constants'
import { MYINFO_LOGIN_COOKIE_NAME } from '../../../../../modules/myinfo/myinfo.constants'
import getMyInfoHashModel from '../../../../../modules/myinfo/myinfo_hash.model'
import {
  CpOidcClient,
  SpOidcClient,
} from '../../../../../modules/spcp/spcp.oidc.client'
// Import last so mocks are imported correctly
// eslint-disable-next-line import/first
import { PublicFormsRouter } from '../public-forms.routes'

import {
  MOCK_ATTACHMENT_RESPONSE,
  MOCK_CHECKBOX_FIELD,
  MOCK_CHECKBOX_RESPONSE,
  MOCK_OPTIONAL_VERIFIED_FIELD,
  MOCK_OPTIONAL_VERIFIED_RESPONSE,
  MOCK_SECTION_FIELD,
  MOCK_SECTION_RESPONSE,
  MOCK_STORAGE_NO_RESPONSES_BODY,
  MOCK_TEXT_FIELD,
  MOCK_TEXTFIELD_RESPONSE,
} from './public-forms.routes.spec.constants'

const MyInfoHashModel = getMyInfoHashModel(mongoose)
const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)
const LoginModel = getLoginModel(mongoose)

const MockCpOidcClient = jest.mocked(CpOidcClient)

jest.mock('../../../../../modules/spcp/spcp.oidc.client')

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))

const app = setupApp('/forms', PublicFormsRouter)

describe('public-form.submissions.routes', () => {
  let request: Session

  const mockCpClient = jest.mocked(MockCpOidcClient.mock.instances[0])

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = session(app)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })

  afterAll(async () => await dbHandler.closeDatabase())

  describe('SP, CP and MyInfo authentication', () => {
    describe('SingPass', () => {
      it('should return 200 when submission is valid', async () => {
        // Arrange
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

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          .set('Cookie', ['jwtSp=mockJwt'])

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
          timestamp: expect.any(Number),
        })
      })

      it('should return 401 when submission does not have JWT', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
        // Note cookie is not set

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has the wrong JWT type', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.SP,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          // Note cookie is for CorpPass, not SingPass
          .set('Cookie', ['jwtCp=mockJwt'])

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has invalid JWT', async () => {
        // Arrange
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

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          .set('Cookie', ['jwtSp=mockJwt'])

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has JWT with the wrong shape', async () => {
        // Arrange
        // Mock auth client to return wrong decoded shape
        jest.spyOn(SpOidcClient.prototype, 'verifyJwt').mockResolvedValueOnce({
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

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          .set('Cookie', ['jwtSp=mockJwt'])

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
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
        jest.spyOn(jwt, 'verify').mockReturnValue({ uinFin: MOCK_UINFIN })
        const { form } = await dbHandler.insertEncryptForm({
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

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          .set('Cookie', [
            // The j: indicates that the cookie is in JSON
            `${MYINFO_LOGIN_COOKIE_NAME}=j:${encodeURIComponent(
              MOCK_MYINFO_JWT,
            )}`,
          ])

        // Assert
        // expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
          timestamp: expect.any(Number),
        })
      })

      it('should return 401 when submission is missing MyInfo cookie', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.MyInfo,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
        // Note cookie is not set

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has the wrong cookie type', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.MyInfo,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          // Note cookie is for SingPass, not MyInfo
          .set('Cookie', ['jwtSp=mockJwt'])

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has invalid cookie', async () => {
        // Arrange
        jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
          throw new Error()
        })
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.MyInfo,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          .set('Cookie', [`${MYINFO_LOGIN_COOKIE_NAME}=${MOCK_MYINFO_JWT}`])

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has cookie with the wrong shape', async () => {
        // Arrange
        jest
          .spyOn(jwt, 'verify')
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          .mockReturnValueOnce({ someKey: 'someValue' })
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.MyInfo,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          .set('Cookie', [
            // The j: indicates that the cookie is in JSON
            `${MYINFO_LOGIN_COOKIE_NAME}=j:${MOCK_MYINFO_JWT}`,
          ])

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })
    })

    describe('CorpPass', () => {
      it('should return 200 when submission is valid', async () => {
        // Arrange
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

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          .set('Cookie', ['jwtCp=mockJwt'])

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
          timestamp: expect.any(Number),
        })
      })

      it('should return 401 when submission does not have JWT', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
        // Note cookie is not set

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has the wrong JWT type', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            authType: FormAuthType.CP,
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          // Note cookie is for SingPass, not CorpPass
          .set('Cookie', ['jwtSp=mockJwt'])

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has invalid JWT', async () => {
        // Arrange
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

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          .set('Cookie', ['jwtCp=mockJwt'])

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })

      it('should return 401 when submission has JWT with the wrong shape', async () => {
        // Arrange
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

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
          .query({ captchaResponse: 'null', captchaType: '' })
          .set('Cookie', ['jwtCp=mockJwt'])

        // Assert
        expect(response.status).toBe(401)
        expect(response.body).toEqual({
          message:
            'Something went wrong with your login. Please try logging in and submitting again.',
          messageKey:
            'features.publicForm.backendErrors.submission.loginFailed',
          spcpSubmissionFailure: true,
        })
      })
    })
  })

  describe('POST /forms/:formId/submissions/get-s3-presigned-post-data', () => {
    const FILE_MAP_1 = { id: '64ed84955ac23100636a00a0', size: 1 }
    const FILE_MAP_2 = { id: '64ed84a35ac23100636a00af', size: 19999999 }
    const VALID_PAYLOAD = [FILE_MAP_1, FILE_MAP_2]

    it('should return 400 if payload is not an array', async () => {
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.CP,
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const response = await request
        .post(`/forms/${form._id}/submissions/get-s3-presigned-post-data`)
        .send(FILE_MAP_1)

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Validation failed',
        statusCode: 400,
        validation: {
          body: expect.objectContaining({
            message: '"value" must be an array',
            source: 'body',
          }),
        },
      })
    })

    it('should return 400 if id is invalid', async () => {
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.CP,
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const INVALID_ID_PAYLOAD = JSON.parse(JSON.stringify(VALID_PAYLOAD))
      INVALID_ID_PAYLOAD[0].id = 'invalidObjectId'

      const response = await request
        .post(`/forms/${form._id}/submissions/get-s3-presigned-post-data`)
        .send(INVALID_ID_PAYLOAD)

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Validation failed',
        statusCode: 400,
        validation: {
          body: expect.objectContaining({
            keys: ['0.id'],
            message:
              '"[0].id" with value "invalidObjectId" fails to match the required pattern: /^[0-9a-fA-F]{24}$/',
            source: 'body',
          }),
        },
      })
    })

    it('should return 400 if size of a file is higher than the limit (20MB)', async () => {
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.CP,
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const INVALID_FILE_SIZE_PAYLOAD = JSON.parse(
        JSON.stringify(VALID_PAYLOAD),
      )
      INVALID_FILE_SIZE_PAYLOAD[1].size += 10000000

      const response = await request
        .post(`/forms/${form._id}/submissions/get-s3-presigned-post-data`)
        .send(INVALID_FILE_SIZE_PAYLOAD)

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Validation failed',
        statusCode: 400,
        validation: {
          body: expect.objectContaining({
            keys: ['1.size'],
            message: '"[1].size" must be less than or equal to 20000000',
            source: 'body',
          }),
        },
      })
    })

    it('should return 400 if size of total file size is higher than the limit (20MB)', async () => {
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.CP,
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      const INVALID_TOTAL_FILE_SIZE_PAYLOAD = JSON.parse(
        JSON.stringify(VALID_PAYLOAD),
      )
      INVALID_TOTAL_FILE_SIZE_PAYLOAD[0].size += 1

      const response = await request
        .post(`/forms/${form._id}/submissions/get-s3-presigned-post-data`)
        .send(INVALID_TOTAL_FILE_SIZE_PAYLOAD)

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Validation failed',
        statusCode: 400,
        validation: {
          body: expect.objectContaining({
            keys: [''],
            message: 'Total file size exceeds 20MB',
            source: 'body',
          }),
        },
      })
    })

    it('should return 500 if creating of presigned post data fails', async () => {
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.CP,
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      jest
        .spyOn(FeatureFlagsService, 'getFeatureFlag')
        .mockReturnValue(okAsync(true))
      jest
        .spyOn(s3Operations, 'createPresignedPost')
        .mockRejectedValueOnce(new Error('some error'))

      const response = await request
        .post(`/forms/${form._id}/submissions/get-s3-presigned-post-data`)
        .send(VALID_PAYLOAD)

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        message: 'Could not create presigned post data. Please try again.',
      })
    })

    it('should return 200 with presigned post data if virus scanning is enabled', async () => {
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.CP,
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })

      jest
        .spyOn(FeatureFlagsService, 'getFeatureFlag')
        .mockReturnValue(okAsync(true))

      const expectedPresignedPostData = expect.objectContaining({
        fields: expect.objectContaining({
          Policy: expect.any(String),
          'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
          'X-Amz-Credential': expect.stringMatching(
            /^\w+\/\d{8}\/ap-southeast-1\/s3\/aws4_request$/,
          ),
          'X-Amz-Date': expect.stringMatching(/^\d{8}T\d{6}Z$/),
          'X-Amz-Signature': expect.any(String),
          bucket: expect.any(String),
          key: expect.any(String),
        }),
        url: expect.stringMatching(/^https?:\/\/\w+:?(\d*)?\/.+$/),
      })

      const response = await request
        .post(`/forms/${form._id}/submissions/get-s3-presigned-post-data`)
        .send(VALID_PAYLOAD)

      expect(response.status).toBe(200)
      expect(response.body).toEqual([
        expect.objectContaining({
          id: VALID_PAYLOAD[0].id,
          presignedPostData: expectedPresignedPostData,
        }),
        expect.objectContaining({
          id: VALID_PAYLOAD[1].id,
          presignedPostData: expectedPresignedPostData,
        }),
      ])
    })
  })

  describe('POST /forms/:formId/submissions/storage', () => {
    describe('Joi validation', () => {
      it('should return 200 when submission is valid', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          // MOCK_RESPONSE contains all required keys
          .field(
            'body',
            JSON.stringify({
              responses: [MOCK_TEXTFIELD_RESPONSE],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
          timestamp: expect.any(Number),
        })
      })

      it('should return 200 when answer is empty string for optional field', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            esrvcId: 'mockEsrvcId',
            hasCaptcha: false,
            status: FormStatus.Public,
            form_fields: [
              { ...MOCK_TEXT_FIELD, required: false } as FormFieldSchema,
            ],
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [{ ...MOCK_TEXTFIELD_RESPONSE, answer: '' }],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
          timestamp: expect.any(Number),
        })
      })

      it('should return 200 when response has isHeader key', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
            form_fields: [MOCK_SECTION_FIELD],
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [{ ...MOCK_SECTION_RESPONSE, isHeader: true }],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
          timestamp: expect.any(Number),
        })
      })

      it('should return 200 when signature is empty string for optional verified field', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
            form_fields: [MOCK_OPTIONAL_VERIFIED_FIELD],
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [
                { ...MOCK_OPTIONAL_VERIFIED_RESPONSE, signature: '' },
              ],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
          timestamp: expect.any(Number),
        })
      })

      it('should return 200 when response has answerArray and no answer', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
            form_fields: [MOCK_CHECKBOX_FIELD],
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [MOCK_CHECKBOX_RESPONSE],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
          message: 'Form submission successful.',
          submissionId: expect.any(String),
          timestamp: expect.any(Number),
        })
      })

      it('should return 400 when version key is missing', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          // Note missing responses
          .field(
            'body',
            JSON.stringify({ responses: [MOCK_TEXTFIELD_RESPONSE] }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when responses key is missing', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          // Note missing responses
          .field('body', JSON.stringify({ version: 2 }))
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when response is missing _id', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [omit(MOCK_TEXTFIELD_RESPONSE, '_id')],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when response is missing fieldType', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [omit(MOCK_TEXTFIELD_RESPONSE, 'fieldType')],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when response has invalid fieldType', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [
                { ...MOCK_TEXTFIELD_RESPONSE, fieldType: 'definitelyInvalid' },
              ],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when response is missing answer', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [omit(MOCK_TEXTFIELD_RESPONSE, 'answer')],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when response has both answer and answerArray', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [{ ...MOCK_TEXTFIELD_RESPONSE, answerArray: [] }],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when attachment response has filename but not content', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [omit(MOCK_ATTACHMENT_RESPONSE), 'content'],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

        // Assert
        expect(response.status).toBe(400)
        expect(response.body.message).toEqual('Validation failed')
      })

      it('should return 400 when attachment response has content but not filename', async () => {
        // Arrange
        const { form } = await dbHandler.insertEncryptForm({
          formOptions: {
            hasCaptcha: false,
            status: FormStatus.Public,
          },
        })

        // Act
        const response = await request
          .post(`/forms/${form._id}/submissions/storage`)
          .field(
            'body',
            JSON.stringify({
              responses: [omit(MOCK_ATTACHMENT_RESPONSE), 'filename'],
              version: 2,
            }),
          )
          .query({ captchaResponse: 'null', captchaType: '' })

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

          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/storage`)
            .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null', captchaType: '' })
            .set('Cookie', ['jwtSp=mockJwt'])

          // Assert
          expect(response.status).toBe(200)
          expect(response.body).toEqual({
            message: 'Form submission successful.',
            submissionId: expect.any(String),
            timestamp: expect.any(Number),
          })
        })

        it('should return 401 when submission does not have JWT', async () => {
          // Arrange
          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/storage`)
            .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null', captchaType: '' })
          // Note cookie is not set

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            messageKey:
              'features.publicForm.backendErrors.submission.loginFailed',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has the wrong JWT type', async () => {
          // Arrange
          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/storage`)
            .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null', captchaType: '' })
            // Note cookie is for CorpPass, not SingPass
            .set('Cookie', ['jwtCp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            messageKey:
              'features.publicForm.backendErrors.submission.loginFailed',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has invalid JWT', async () => {
          // Arrange
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

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/storage`)
            .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null', captchaType: '' })
            .set('Cookie', ['jwtSp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            messageKey:
              'features.publicForm.backendErrors.submission.loginFailed',
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

          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.SP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/storage`)
            .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null', captchaType: '' })
            .set('Cookie', ['jwtSp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            messageKey:
              'features.publicForm.backendErrors.submission.loginFailed',
            spcpSubmissionFailure: true,
          })
        })
      })

      describe('CorpPass', () => {
        it('should return 200 when submission is valid', async () => {
          // Arrange
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

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/storage`)
            .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null', captchaType: '' })
            .set('Cookie', ['jwtCp=mockJwt'])

          // Assert
          expect(response.status).toBe(200)
          expect(response.body).toEqual({
            message: 'Form submission successful.',
            submissionId: expect.any(String),
            timestamp: expect.any(Number),
          })
        })

        it('should return 401 when submission does not have JWT', async () => {
          // Arrange
          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/storage`)
            .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null', captchaType: '' })
          // Note cookie is not set

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            messageKey:
              'features.publicForm.backendErrors.submission.loginFailed',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has the wrong JWT type', async () => {
          // Arrange
          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              esrvcId: 'mockEsrvcId',
              authType: FormAuthType.CP,
              hasCaptcha: false,
              status: FormStatus.Public,
            },
          })

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/storage`)
            .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null', captchaType: '' })
            // Note cookie is for SingPass, not CorpPass
            .set('Cookie', ['jwtSp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            messageKey:
              'features.publicForm.backendErrors.submission.loginFailed',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has invalid JWT', async () => {
          // Arrange
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

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/storage`)
            .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null', captchaType: '' })
            .set('Cookie', ['jwtCp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            messageKey:
              'features.publicForm.backendErrors.submission.loginFailed',
            spcpSubmissionFailure: true,
          })
        })

        it('should return 401 when submission has JWT with the wrong shape', async () => {
          // Arrange
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

          // Act
          const response = await request
            .post(`/forms/${form._id}/submissions/storage`)
            .field('body', JSON.stringify(MOCK_STORAGE_NO_RESPONSES_BODY))
            .query({ captchaResponse: 'null', captchaType: '' })
            .set('Cookie', ['jwtCp=mockJwt'])

          // Assert
          expect(response.status).toBe(401)
          expect(response.body).toEqual({
            message:
              'Something went wrong with your login. Please try logging in and submitting again.',
            messageKey:
              'features.publicForm.backendErrors.submission.loginFailed',
            spcpSubmissionFailure: true,
          })
        })
      })
    })
  })

  describe('MRF step login (POST .../submissions/:submissionId/auth/*)', () => {
    // Mounted at the real prefix so the path-scoped step cookie round-trips.
    const stepApp = setupApp('/api/v3/forms', PublicFormsRouter)
    const STEP_TOKEN = stepToken.generate()
    const STEP_1_FIELD = {
      _id: new ObjectId().toHexString(),
      fieldType: 'textfield',
      title: 'Request',
    }
    const NAME_FIELD = {
      _id: new ObjectId().toHexString(),
      fieldType: 'textfield',
      title: 'Name',
      myInfo: { attr: 'name' },
    }
    const MYINFO_STEP_AUTH = {
      auth_type: FormAuthType.MyInfo,
      is_submitter_id_collection_enabled: true,
    }

    const insertStepSubmission = async (
      step2Auth: unknown = MYINFO_STEP_AUTH,
      overrides: Record<string, unknown> = {},
    ) => {
      // The live form has no login at all; only the submission copy does.
      const { form } = await dbHandler.insertMultirespondentForm({
        formOptions: { status: FormStatus.Public, esrvcId: 'live-esrvc-id' },
      })
      const submission = await MultirespondentSubmission.create({
        form: form._id,
        submissionType: SubmissionType.Multirespondent,
        form_fields: [STEP_1_FIELD, NAME_FIELD],
        form_logics: [],
        workflow: [
          { workflow_type: 'static', emails: [], edit: [STEP_1_FIELD._id] },
          {
            workflow_type: 'static',
            emails: [],
            edit: [NAME_FIELD._id],
            ...(step2Auth ? { auth: step2Auth } : {}),
          },
        ],
        submissionPublicKey: 'mockSubmissionPublicKey',
        encryptedSubmissionSecretKey: 'mockEncryptedSubmissionSecretKey',
        encryptedContent: 'mockEncryptedContent',
        version: 3,
        workflowStep: 0,
        stepTokenHash: stepToken.hash(STEP_TOKEN),
        esrvcId: 'snapshot-esrvc-id',
        ...overrides,
      })
      const formId = String(form._id)
      const submissionId = String(submission._id)
      return {
        form,
        formId,
        submissionId,
        authUrl: `/api/v3/forms/${formId}/submissions/${submissionId}/auth`,
        context: {
          formId,
          submissionId,
          workflowStep: 1,
          stepTokenHash: stepToken.hash(STEP_TOKEN),
        },
      }
    }

    let stepRequest: Session
    beforeEach(() => {
      stepRequest = session(stepApp)
    })

    it('should report no login for a step saved without login', async () => {
      const { authUrl } = await insertStepSubmission(null)

      const response = await stepRequest
        .post(`${authUrl}/session`)
        .send({ stepToken: STEP_TOKEN })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        workflowStep: 1,
        authType: FormAuthType.NIL,
        isSubmitterIdCollectionEnabled: false,
        isWhitelistEnabled: false,
      })
    })

    it('should return 403 for an invalid step token', async () => {
      const { authUrl } = await insertStepSubmission()

      const response = await stepRequest
        .post(`${authUrl}/session`)
        .send({ stepToken: stepToken.generate() })

      expect(response.status).toBe(403)
    })

    it('should return 409 once the workflow has moved past every step', async () => {
      const { authUrl } = await insertStepSubmission(MYINFO_STEP_AUTH, {
        workflowStep: 1,
      })

      const response = await stepRequest
        .post(`${authUrl}/session`)
        .send({ stepToken: STEP_TOKEN })

      expect(response.status).toBe(409)
    })

    it('should not start a login for a step without one', async () => {
      const { authUrl } = await insertStepSubmission(null)

      const response = await stepRequest
        .post(`${authUrl}/redirect`)
        .send({ stepToken: STEP_TOKEN })

      expect(response.status).toBe(400)
    })

    it('should not treat a legacy form-level login as a step login', async () => {
      const { authUrl } = await insertStepSubmission({
        auth_type: FormAuthType.CP,
        is_submitter_id_collection_enabled: true,
      })

      const response = await stepRequest
        .post(`${authUrl}/session`)
        .set('Cookie', ['jwtCp=mockJwt', `${MYINFO_LOGIN_COOKIE_NAME}=mockJwt`])
        .send({ stepToken: STEP_TOKEN })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        workflowStep: 1,
        authType: FormAuthType.CP,
        isSubmitterIdCollectionEnabled: true,
        isWhitelistEnabled: false,
      })
    })

    it('should start Corppass with the submission e-service ID and a step binding', async () => {
      const { authUrl, formId } = await insertStepSubmission({
        auth_type: FormAuthType.CP,
        is_submitter_id_collection_enabled: true,
      })
      mockCpClient.createAuthorisationUrl.mockResolvedValueOnce(
        'https://corppass.example/authorize',
      )

      const response = await stepRequest
        .post(`${authUrl}/redirect`)
        .send({ stepToken: STEP_TOKEN, encodedQuery: 'cXVlcnlJZD1hYmM=' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        redirectURL: 'https://corppass.example/authorize',
      })
      const [state, esrvcId] = mockCpClient.createAuthorisationUrl.mock.calls[0]
      expect(esrvcId).toBe('snapshot-esrvc-id')
      const nonce = state.split('-')[2]
      expect(state).toBe(`/${formId}-false-${nonce}-cXVlcnlJZD1hYmM=`)
      expect(String(response.headers['set-cookie'])).toContain(
        `cpStepBinding_${nonce}=`,
      )
    })

    it('should complete a MyInfo login for the step only', async () => {
      const { authUrl, formId, context } = await insertStepSubmission()
      const mrfContext = { ...context, authType: FormAuthType.MyInfo }
      const startLoginSpy = jest
        .spyOn(MyInfoFapiService, 'startLogin')
        .mockReturnValue(
          okAsync({
            sessionId: 'fapi-session-id',
            redirectUrl: 'https://singpass.example/authorize',
          }),
        )
      const loadPersonSpy = jest
        .spyOn(MyInfoFapiService, 'loadPersonForSession')
        .mockReturnValue(
          okAsync(
            new MyInfoData({ uinFin: MOCK_UINFIN, data: MOCK_MYINFO_DATA }),
          ),
        )

      // Act: start the login, then load the step once back from Singpass
      const redirectResponse = await stepRequest
        .post(`${authUrl}/redirect`)
        .send({ stepToken: STEP_TOKEN })
      const sessionResponse = await stepRequest
        .post(`${authUrl}/session`)
        .send({ stepToken: STEP_TOKEN })

      // Assert
      expect(redirectResponse.status).toBe(200)
      expect(startLoginSpy).toHaveBeenCalledWith(
        expect.objectContaining({ requestedAttributes: ['name'], mrfContext }),
      )
      expect(loadPersonSpy).toHaveBeenCalledWith({
        sessionId: 'fapi-session-id',
        formId,
        mrfContext,
      })
      expect(sessionResponse.status).toBe(200)
      expect(sessionResponse.body).toMatchObject({
        workflowStep: 1,
        authType: FormAuthType.MyInfo,
        spcpSession: { userName: MOCK_UINFIN },
        prefilledFields: [
          { _id: NAME_FIELD._id, fieldValue: 'TAN XIAO HUI', disabled: true },
        ],
      })
      expect(sessionResponse.body.prefilledFields).toHaveLength(1)
      // Hashes belong to this login session, not the form-level login.
      await expect(
        MyInfoHashModel.findHashes(MOCK_UINFIN, formId, 'fapi-session-id'),
      ).resolves.toHaveProperty('name')
      await expect(
        MyInfoHashModel.findHashes(MOCK_UINFIN, formId),
      ).resolves.toBeNull()
      await expect(
        LoginModel.find({ form: formId }).lean(),
      ).resolves.toMatchObject([{ authType: FormAuthType.MyInfo }])
    })

    it('should keep the step session without refetching or rebilling, until logout', async () => {
      const { authUrl, formId } = await insertStepSubmission()
      jest
        .spyOn(MyInfoFapiService, 'startLogin')
        .mockReturnValue(
          okAsync({ sessionId: 'fapi-session-id', redirectUrl: 'https://sp' }),
        )
      const loadPersonSpy = jest
        .spyOn(MyInfoFapiService, 'loadPersonForSession')
        .mockReturnValue(
          okAsync(
            new MyInfoData({ uinFin: MOCK_UINFIN, data: MOCK_MYINFO_DATA }),
          ),
        )
      await stepRequest
        .post(`${authUrl}/redirect`)
        .send({ stepToken: STEP_TOKEN })
      await stepRequest
        .post(`${authUrl}/session`)
        .send({ stepToken: STEP_TOKEN })

      const reloaded = await stepRequest
        .post(`${authUrl}/session`)
        .send({ stepToken: STEP_TOKEN })
      const logout = await stepRequest.post(`${authUrl}/logout`).send({})
      const afterLogout = await stepRequest
        .post(`${authUrl}/session`)
        .send({ stepToken: STEP_TOKEN })

      expect(reloaded.body.spcpSession).toMatchObject({ userName: MOCK_UINFIN })
      expect(reloaded.body.prefilledFields).toBeUndefined()
      expect(loadPersonSpy).toHaveBeenCalledTimes(1)
      await expect(LoginModel.countDocuments({ form: formId })).resolves.toBe(1)
      expect(logout.status).toBe(200)
      expect(afterLogout.body.spcpSession).toBeUndefined()
    })

    it('should not start a login when the step token is wrong or missing', async () => {
      const { authUrl } = await insertStepSubmission()
      const startLoginSpy = jest.spyOn(MyInfoFapiService, 'startLogin')

      const wrong = await stepRequest
        .post(`${authUrl}/redirect`)
        .send({ stepToken: stepToken.generate() })
      const missing = await stepRequest.post(`${authUrl}/redirect`).send({})

      expect(wrong.status).toBe(403)
      expect(missing.status).toBe(403)
      expect(startLoginSpy).not.toHaveBeenCalled()
    })

    describe('with an eligible-respondent list on the step', () => {
      const LISTED_STEP_AUTH = {
        ...MYINFO_STEP_AUTH,
        whitelisted_submitter_ids: {
          isWhitelistEnabled: true,
          encryptedWhitelistedSubmitterIds: new ObjectId().toHexString(),
        },
      }
      const mockFapiLogin = () => {
        jest.spyOn(MyInfoFapiService, 'startLogin').mockReturnValue(
          okAsync({
            sessionId: 'fapi-session-id',
            redirectUrl: 'https://sp',
          }),
        )
        jest
          .spyOn(MyInfoFapiService, 'loadPersonForSession')
          .mockReturnValue(
            okAsync(
              new MyInfoData({ uinFin: MOCK_UINFIN, data: MOCK_MYINFO_DATA }),
            ),
          )
      }

      it('should refuse a respondent who is not listed, without a session or saved hashes', async () => {
        const { authUrl, formId } = await insertStepSubmission(LISTED_STEP_AUTH)
        mockFapiLogin()
        const whitelistSpy = jest
          .spyOn(FormService, 'checkIsSubmitterNotWhitelisted')
          .mockReturnValue(okAsync(true))
        await stepRequest
          .post(`${authUrl}/redirect`)
          .send({ stepToken: STEP_TOKEN })

        const response = await stepRequest
          .post(`${authUrl}/session`)
          .send({ stepToken: STEP_TOKEN })
        const retried = await stepRequest
          .post(`${authUrl}/session`)
          .send({ stepToken: STEP_TOKEN })

        expect(whitelistSpy).toHaveBeenCalledWith(
          expect.objectContaining({ submitterId: MOCK_UINFIN }),
        )
        expect(response.status).toBe(200)
        expect(response.body.errorCodes).toEqual([
          ErrorCode.respondentNotWhitelisted,
        ])
        expect(response.body.spcpSession).toBeUndefined()
        expect(retried.body.spcpSession).toBeUndefined()
        await expect(
          MyInfoHashModel.findHashes(MOCK_UINFIN, formId, 'fapi-session-id'),
        ).resolves.toBeNull()
      })

      it('should let a listed respondent in', async () => {
        const { authUrl } = await insertStepSubmission(LISTED_STEP_AUTH)
        mockFapiLogin()
        jest
          .spyOn(FormService, 'checkIsSubmitterNotWhitelisted')
          .mockReturnValue(okAsync(false))
        await stepRequest
          .post(`${authUrl}/redirect`)
          .send({ stepToken: STEP_TOKEN })

        const response = await stepRequest
          .post(`${authUrl}/session`)
          .send({ stepToken: STEP_TOKEN })

        expect(response.body.errorCodes).toBeUndefined()
        expect(response.body.spcpSession).toMatchObject({
          userName: MOCK_UINFIN,
        })
      })
    })
  })
})
