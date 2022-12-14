import MyInfoClient, { IMyInfoConfig } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson-ext'
import jwt from 'jsonwebtoken'
import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import {
  MOCK_ACCESS_TOKEN,
  MOCK_AUTH_CODE,
  MOCK_MYINFO_JWT,
  MOCK_UINFIN,
} from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'
import { MYINFO_AUTH_CODE_COOKIE_NAME } from 'src/app/modules/myinfo/myinfo.constants'
import { MyInfoAuthCodeCookieState } from 'src/app/modules/myinfo/myinfo.types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormAuthType, FormStatus } from '../../../../../../shared/types'
import * as AuthService from '../../../auth/auth.service'
import { CpOidcClient, SpOidcClient } from '../../../spcp/spcp.oidc.client'
import { PublicFormRouter } from '../public-form.routes'

jest.mock('@opengovsg/myinfo-gov-client', () => ({
  MyInfoGovClient: jest.fn().mockReturnValue({
    extractUinFin: jest.fn(),
    getPerson: jest.fn(),
    getAccessToken: jest.fn(),
  }),
  MyInfoMode: jest.requireActual('@opengovsg/myinfo-gov-client').MyInfoMode,
  MyInfoSource: jest.requireActual('@opengovsg/myinfo-gov-client').MyInfoSource,
  MyInfoAddressType: jest.requireActual('@opengovsg/myinfo-gov-client')
    .MyInfoAddressType,
  MyInfoAttribute: jest.requireActual('@opengovsg/myinfo-gov-client')
    .MyInfoAttribute,
}))

const MockMyInfoGovClient = jest.mocked(
  new MyInfoClient.MyInfoGovClient({} as IMyInfoConfig),
)

jest.mock('../../../spcp/spcp.oidc.client')

jest.mock('jsonwebtoken')
const MockJwtLib = jest.mocked(jwt)

const MockCpOidcClient = jest.mocked(CpOidcClient)

const app = setupApp('/', PublicFormRouter, {
  setupWithAuth: false,
})

describe('public-form.routes', () => {
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

  describe('GET /:formId/publicform', () => {
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
      const actualResponse = await request.get(`/${form._id}/publicform`)

      // Assert
      expect(actualResponse.status).toEqual(200)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 200 with public form when form has FormAuthType.SP and valid formId', async () => {
      // Arrange
      const spVerifyJwtSpy = jest.spyOn(SpOidcClient.prototype, 'verifyJwt')

      spVerifyJwtSpy.mockResolvedValueOnce({
        userName: MOCK_COOKIE_PAYLOAD.userName,
        iat: 100000000,
        exp: 1000000000,
        rememberMe: false,
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
        spcpSession: {
          userName: MOCK_COOKIE_PAYLOAD.userName,
          iat: 100000000,
          exp: 1000000000,
          rememberMe: false,
        },
        isIntranetUser: false,
      }

      // Act
      // Set cookie on request
      const actualResponse = await request
        .get(`/${formId}/publicform`)
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
        rememberMe: false,
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
        spcpSession: {
          userName: MOCK_COOKIE_PAYLOAD.userName,
          userInfo: 'MyCorpPassUEN',
          iat: 100000000,
          exp: 1000000000,
          rememberMe: false,
        },
        isIntranetUser: false,
      }

      // Act
      // Set cookie on request
      const actualResponse = await request
        .get(`/${formId}/publicform`)
        .set('Cookie', ['jwtCp=mockJwt'])

      // Assert
      expect(actualResponse.status).toEqual(200)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })
    it('should return 200 with public form when form has FormAuthType.MyInfo and valid formId', async () => {
      // Arrange
      MockMyInfoGovClient.getAccessToken.mockResolvedValueOnce(
        MOCK_ACCESS_TOKEN,
      )
      MockMyInfoGovClient.getPerson.mockResolvedValueOnce({
        uinFin: MOCK_UINFIN,
        data: {},
      })
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
      const authCodeCookie = JSON.stringify({
        authCode: MOCK_AUTH_CODE,
        state: MyInfoAuthCodeCookieState.Success,
      })

      // Act
      const actualResponse = await request
        .get(`/${form._id}/publicform`)
        .set('Cookie', [
          // The j: indicates that the cookie is in JSON
          `${MYINFO_AUTH_CODE_COOKIE_NAME}=j:${encodeURIComponent(
            authCodeCookie,
          )}`,
        ])

      // Assert
      expect(actualResponse.status).toEqual(200)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 404 if the form does not exist', async () => {
      // Arrange
      const cookie = JSON.stringify({
        authCode: MOCK_AUTH_CODE,
        state: MyInfoAuthCodeCookieState.Success,
      })
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          message: 'Form not found',
        }),
      )

      // Act
      const actualResponse = await request
        .get(`/${MOCK_FORM_ID}/publicform`)
        .set('Cookie', [
          // The j: indicates that the cookie is in JSON
          `${MYINFO_AUTH_CODE_COOKIE_NAME}=${cookie}`,
        ])

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
      const actualResponse = await request.get(`/${form._id}/publicform`)

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
      const actualResponse = await request.get(`/${form._id}/publicform`)

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
      const actualResponse = await request.get(`/${form._id}/publicform`)

      // Assert
      expect(actualResponse.status).toEqual(500)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })
  })
})
