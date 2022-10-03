import MyInfoClient, { IMyInfoConfig } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson-ext'
import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'
import { mocked } from 'ts-jest/utils'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import { MYINFO_COOKIE_NAME } from 'src/app/modules/myinfo/myinfo.constants'
import { MyInfoCookieState } from 'src/app/modules/myinfo/myinfo.types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormAuthType, FormStatus } from '../../../../../../../shared/types'
import * as AuthService from '../../../../../modules/auth/auth.service'
import {
  CpOidcClient,
  SpOidcClient,
} from '../../../../../modules/spcp/spcp.oidc.client'
import { PublicFormsRouter } from '../public-forms.routes'

import { MOCK_UINFIN } from './public-forms.routes.spec.constants'

jest.mock('../../../../../modules/spcp/spcp.oidc.client')

jest.mock('@opengovsg/spcp-auth-client')
const MockCpOidcClient = mocked(CpOidcClient, true)

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

describe('public-form.form.routes', () => {
  let request: Session

  const mockCpClient = mocked(MockCpOidcClient.mock.instances[0], true)

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
      MockMyInfoGovClient.getPerson.mockResolvedValueOnce({
        uinFin: MOCK_UINFIN,
        data: {},
      })
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
      const cookie = JSON.stringify({
        accessToken: 'mockAccessToken',
        usedCount: 0,
        state: MyInfoCookieState.Success,
      })

      // Act
      const actualResponse = await request
        .get(`/forms/${form._id}`)
        .set('Cookie', [
          // The j: indicates that the cookie is in JSON
          `${MYINFO_COOKIE_NAME}=j:${encodeURIComponent(cookie)}`,
        ])

      // Assert
      expect(actualResponse.status).toEqual(200)
      expect(actualResponse.body).toEqual(expectedResponseBody)
    })

    it('should return 404 if the form does not exist', async () => {
      // Arrange
      const cookie = JSON.stringify({
        accessToken: 'mockAccessToken',
        usedCount: 0,
        state: MyInfoCookieState.Success,
      })
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const expectedResponseBody = JSON.parse(
        JSON.stringify({
          message: 'Form not found',
        }),
      )

      // Act
      const actualResponse = await request
        .get(`/forms/${MOCK_FORM_ID}`)
        .set('Cookie', [
          // The j: indicates that the cookie is in JSON
          `${MYINFO_COOKIE_NAME}=j:${encodeURIComponent(cookie)}`,
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
})
