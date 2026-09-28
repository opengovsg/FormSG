import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { createHmac } from 'crypto'
import { FormAuthType, FormStatus } from 'formsg-shared/types'
import jwt from 'jsonwebtoken'
import { errAsync, okAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import { MOCK_MYINFO_JWT } from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'
import { MYINFO_FAPI_SESSION_COOKIE_NAME } from 'src/app/modules/myinfo/fapi/myinfo.fapi.constants'
import * as MyInfoFapiService from 'src/app/modules/myinfo/fapi/myinfo.fapi.service'
import { MyInfoData } from 'src/app/modules/myinfo/myinfo.adapter'
import { IPersonResponse } from 'src/app/modules/myinfo/myinfo.person.types'

import * as AuthService from '../../../../../modules/auth/auth.service'
import {
  CpOidcClient,
  SpOidcClient,
} from '../../../../../modules/spcp/spcp.oidc.client'
import { PublicFormsRouter } from '../public-forms.routes'

import { MOCK_UINFIN } from './public-forms.routes.spec.constants'

jest.mock('../../../../../modules/spcp/spcp.oidc.client')

const MockCpOidcClient = jest.mocked(CpOidcClient)

jest.mock('jsonwebtoken')
const MockJwtLib = jest.mocked(jwt)

jest.mock('src/app/modules/myinfo/fapi/myinfo.fapi.service')
const MockMyInfoFapiService = jest.mocked(MyInfoFapiService)

const app = setupApp('/forms', PublicFormsRouter)
const MOCK_FAPI_SESSION_ID = 'mock-fapi-session-id'
const MOCK_SIGNED_FAPI_COOKIE = `${MYINFO_FAPI_SESSION_COOKIE_NAME}=s:${MOCK_FAPI_SESSION_ID}.${createHmac(
  'sha256',
  'test-session-secret',
)
  .update(MOCK_FAPI_SESSION_ID)
  .digest('base64')
  .replace(/=+$/, '')}`

describe('public-form.form.routes', () => {
  let request: Session

  const mockCpClient = jest.mocked(MockCpOidcClient.mock.instances[0])

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())
  describe('GET /:formId', () => {
    const MOCK_COOKIE_PAYLOAD = {
      userName: 'mock',
      rememberMe: false,
    }

    it('should return 200 with public form when form has FormAuthType.NIL and valid formId', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: { status: FormStatus.Public },
      })
      // NOTE: This is needed to inject admin info into the form
      const fullForm = await dbHandler.getFullFormById(form._id)
      expect(fullForm).not.toBeNull()
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          form: fullForm?.getPublicView(),
          isIntranetUser: false,
        }),
      )

      // Act
      const actualResponse = await request.get(`/forms/${form._id}`)

      // Assert
      expect(actualResponse.status).toEqual(200)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 200 with public form when form has FormAuthType.SP and valid formId', async () => {
      // Arrange
      jest.spyOn(SpOidcClient.prototype, 'verifyJwt').mockResolvedValueOnce({
        userName: MOCK_COOKIE_PAYLOAD.userName,
        iat: 100000000,
        exp: 1000000000,
      })
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.SP,
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })
      const formId = form._id
      // NOTE: This is needed to inject admin info into the form
      const fullForm = await dbHandler.getFullFormById(formId)
      const expectedResponseBody = {
        form: JSON.parse(JSON.stringify(fullForm?.getPublicView())),
        spcpSession: expect.objectContaining({
          userName: MOCK_COOKIE_PAYLOAD.userName,
          iat: 100000000,
          exp: 1000000000,
        }),
        isIntranetUser: false,
      }

      // Act
      // Set cookie on request
      const actualResponse = await request
        .get(`/forms/${form._id}`)
        .set('Cookie', ['jwtSp=mockJwt'])

      // Assert
      expect(actualResponse.status).toEqual(200)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })
    it('should return 200 with public form when form has FormAuthType.CP and valid formId', async () => {
      // Arrange
      mockCpClient.verifyJwt.mockResolvedValueOnce({
        userName: MOCK_COOKIE_PAYLOAD.userName,
        userInfo: 'MyCorpPassUEN',
        iat: 100000000,
        exp: 1000000000,
      })

      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.CP,
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })
      const formId = form._id
      // NOTE: This is needed to inject admin info into the form
      const fullForm = await dbHandler.getFullFormById(formId)
      const expectedResponseBody = {
        form: JSON.parse(JSON.stringify(fullForm?.getPublicView())),
        spcpSession: expect.objectContaining({
          userName: MOCK_COOKIE_PAYLOAD.userName,
          userInfo: 'MyCorpPassUEN',
          iat: 100000000,
          exp: 1000000000,
        }),
        isIntranetUser: false,
      }

      // Act
      // Set cookie on request
      const actualResponse = await request
        .get(`/forms/${form._id}`)
        .set('Cookie', ['jwtCp=mockJwt'])

      // Assert
      expect(actualResponse.status).toEqual(200)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })
    it('should return 200 with public form when form has FormAuthType.MyInfo and valid formId', async () => {
      // Arrange
      MockMyInfoFapiService.loadPersonForSession.mockReturnValueOnce(
        okAsync(
          new MyInfoData({
            uinFin: MOCK_UINFIN,
            data: {},
          } as IPersonResponse),
        ),
      )
      // Ignore TS error because .sign has multiple overloads
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      MockJwtLib.sign.mockReturnValue(MOCK_MYINFO_JWT)

      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.MyInfo,
          hasCaptcha: false,
          status: FormStatus.Public,
        },
      })
      // NOTE: This is needed to inject admin info into the form
      const fullForm = await dbHandler.getFullFormById(form._id)
      expect(fullForm).not.toBeNull()
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          form: fullForm?.getPublicView(),
          spcpSession: { userName: 'S1234567A' },
          isIntranetUser: false,
        }),
      )

      // Act
      const actualResponse = await request
        .get(`/forms/${form._id}`)
        .set('Cookie', [MOCK_SIGNED_FAPI_COOKIE])

      // Assert
      expect(actualResponse.status).toEqual(200)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 404 if the form does not exist', async () => {
      // Arrange
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          message: 'Form not found',
        }),
      )

      // Act
      const actualResponse = await request.get(`/forms/${MOCK_FORM_ID}`)

      // Assert
      expect(actualResponse.status).toEqual(404)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 404 if the form is private', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: { status: FormStatus.Private },
      })
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          message: form.inactiveMessage,
          formTitle: form.title,
          isPageFound: true,
        }),
      )

      // Act
      const actualResponse = await request.get(`/forms/${form._id}`)

      // Assert
      expect(actualResponse.status).toEqual(404)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 410 if the form has been archived', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: { status: FormStatus.Archived },
      })
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          message: 'This form is no longer active',
        }),
      )

      // Act
      const actualResponse = await request.get(`/forms/${form._id}`)

      // Assert
      expect(actualResponse.status).toEqual(410)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 500 if a database error occurs', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: { status: FormStatus.Public },
      })
      const expectedError = new DatabaseError('all your base are belong to us')
      const expectedResponseBody = JSON.parse(
        JSON.stringify({ message: expectedError.message }),
      )
      jest
        .spyOn(AuthService, 'getFormIfPublic')
        .mockReturnValueOnce(errAsync(expectedError))

      // Act
      const actualResponse = await request.get(`/forms/${form._id}`)

      // Assert
      expect(actualResponse.status).toEqual(500)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })
  })

  describe('GET /:formId/sample-submission', () => {
    it('should return 200 with public form when form has a valid formId', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: { status: FormStatus.Public },
      })
      // NOTE: This is needed to inject admin info into the form
      const fullForm = await dbHandler.getFullFormById(form._id)
      expect(fullForm).not.toBeNull()

      const formFields = fullForm?.getPublicView().form_fields
      if (!formFields) return
      const expectedSampleData = {}
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          responses: expectedSampleData,
        }),
      )

      // Act
      const actualResponse = await request.get(
        `/forms/${form._id}/sample-submission`,
      )

      // Assert
      expect(actualResponse.status).toEqual(200)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 404 if the form does not exist', async () => {
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          message: 'Form not found',
        }),
      )

      // Act
      const actualResponse = await request.get(
        `/forms/${MOCK_FORM_ID}/sample-submission`,
      )

      // Assert
      expect(actualResponse.status).toEqual(404)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 404 if the form is private', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: { status: FormStatus.Private },
      })
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          message: form.inactiveMessage,
          formTitle: form.title,
          isPageFound: true,
        }),
      )

      // Act
      const actualResponse = await request.get(
        `/forms/${form._id}/sample-submission`,
      )

      // Assert
      expect(actualResponse.status).toEqual(404)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 410 if the form has been archived', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: { status: FormStatus.Archived },
      })
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          message: 'This form is no longer active',
        }),
      )

      // Act
      const actualResponse = await request.get(
        `/forms/${form._id}/sample-submission`,
      )

      // Assert
      expect(actualResponse.status).toEqual(410)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 500 if a database error occurs', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: { status: FormStatus.Public },
      })
      const expectedError = new DatabaseError('all your base are belong to us')
      const expectedResponseBody = JSON.parse(
        JSON.stringify({ message: expectedError.message }),
      )
      jest
        .spyOn(AuthService, 'getFormIfPublic')
        .mockReturnValueOnce(errAsync(expectedError))

      // Act
      const actualResponse = await request.get(
        `/forms/${form._id}/sample-submission`,
      )

      // Assert
      expect(actualResponse.status).toEqual(500)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })
  })
})
