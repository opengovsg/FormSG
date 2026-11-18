import { setupApp } from '__tests__/integration/helpers/express-setup'
import { buildCelebrateError } from '__tests__/unit/backend/helpers/celebrate'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { jsonParseStringify } from '__tests__/unit/backend/helpers/serialize-data'
import { ObjectId } from 'bson'
import { FormAuthType, FormStatus } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'
import { errAsync, okAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import { getRedirectTargetSpcpOidc } from 'src/app/modules/spcp/spcp.util'

import * as FormService from '../../../../../modules/form/form.service'
import { MYINFO_FAPI_SESSION_COOKIE_NAME } from '../../../../../modules/myinfo/fapi/myinfo.fapi.constants'
import * as MyInfoFapiService from '../../../../../modules/myinfo/fapi/myinfo.fapi.service'
import { CreateRedirectUrlError } from '../../../../../modules/spcp/spcp.errors'
import {
  CpOidcClient,
  SpOidcClient,
} from '../../../../../modules/spcp/spcp.oidc.client'
import { SpOidcServiceClass } from '../../../../../modules/spcp/spcp.oidc.service/spcp.oidc.service.sp'
import { PublicFormsRouter } from '../public-forms.routes'

jest.mock('../../../../../modules/spcp/spcp.oidc.client')

const MOCK_FAPI_SESSION_ID = 'mock-fapi-session-id'
const MOCK_FAPI_REDIRECT_URL =
  'https://id.singpass.gov.sg/fapi/auth?request_uri=urn:mock'

const app = setupApp('/forms', PublicFormsRouter)
describe('public-form.auth.routes', () => {
  let request: Session

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())
  describe('GET /forms/:formId/auth/redirect', () => {
    it('should return 200 with the redirect URL when the form is valid and has authType SP', async () => {
      // Arrange
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          authType: FormAuthType.SP,
          status: FormStatus.Public,
          esrvcId: new ObjectId().toHexString(),
        },
      })

      jest
        .spyOn(SpOidcClient.prototype, 'createAuthorisationUrl')
        .mockResolvedValue(
          `${encodeURI(
            getRedirectTargetSpcpOidc(form._id, FormAuthType.SP, false),
          )}&esrvc=${form.esrvcId}`,
        )

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.OK)
      expect(response.body).toMatchObject({
        redirectURL: expect.toIncludeMultiple([
          encodeURI(
            getRedirectTargetSpcpOidc(form._id, FormAuthType.SP, false),
          ),
          form.esrvcId!,
        ]),
      })
    })

    it('should return 200 with the redirect URL when the form is valid and has authType CP', async () => {
      // Arrange
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          authType: FormAuthType.CP,
          status: FormStatus.Public,
          esrvcId: new ObjectId().toHexString(),
        },
      })

      jest
        .spyOn(CpOidcClient.prototype, 'createAuthorisationUrl')
        .mockResolvedValue(
          `${encodeURI(
            getRedirectTargetSpcpOidc(form._id, FormAuthType.CP, false),
          )}&esrvc=${form.esrvcId}`,
        )

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.OK)
      expect(response.body).toMatchObject({
        redirectURL: expect.toIncludeMultiple([
          encodeURI(
            getRedirectTargetSpcpOidc(form._id, FormAuthType.CP, false),
          ),
          form.esrvcId!,
        ]),
      })
    })

    it('should return 200 with the FAPI redirect URL and set the FAPI session cookie when the form is valid and has authType MyInfo', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.MyInfo,
          status: FormStatus.Public,
          esrvcId: new ObjectId().toHexString(),
        },
      })
      const startLoginSpy = jest
        .spyOn(MyInfoFapiService, 'startLogin')
        .mockReturnValueOnce(
          okAsync({
            sessionId: MOCK_FAPI_SESSION_ID,
            redirectUrl: MOCK_FAPI_REDIRECT_URL,
          }),
        )

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.OK)
      expect(response.body).toEqual({ redirectURL: MOCK_FAPI_REDIRECT_URL })
      expect(startLoginSpy).toHaveBeenCalledWith(
        expect.objectContaining({ formId: String(form._id) }),
      )
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`${MYINFO_FAPI_SESSION_COOKIE_NAME}=`),
        ]),
      )
    })

    it('should return 400 when the request has an invalid type for isPersistentLogin', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.MyInfo,
          status: FormStatus.Public,
          esrvcId: new ObjectId().toHexString(),
        },
      })
      const expectedResponse = buildCelebrateError({
        query: {
          key: 'isPersistentLogin',
          message: '"isPersistentLogin" must be a boolean',
        },
      })

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: '1' })

      // Assert
      expect(response.status).toEqual(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 400 when the form has authType NIL', async () => {
      // Arrange
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          status: FormStatus.Public,
          esrvcId: new ObjectId().toHexString(),
        },
      })
      const expectedResponse = jsonParseStringify({
        message:
          'Please ensure that the form has authentication enabled. Please refresh and try again.',
      })

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 200 with the FAPI redirect URL when the MyInfo form has no esrvcId', async () => {
      // Arrange
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          authType: FormAuthType.MyInfo,
          status: FormStatus.Public,
        },
      })
      jest.spyOn(MyInfoFapiService, 'startLogin').mockReturnValueOnce(
        okAsync({
          sessionId: MOCK_FAPI_SESSION_ID,
          redirectUrl: MOCK_FAPI_REDIRECT_URL,
        }),
      )

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.OK)
      expect(response.body).toEqual({ redirectURL: MOCK_FAPI_REDIRECT_URL })
    })

    it('should return 404 when the form is not in the database', async () => {
      // Arrange
      const expectedResponse = jsonParseStringify({
        message:
          'Could not find the form requested. Please refresh and try again.',
      })

      // Act
      const response = await request
        .get(`/forms/${new ObjectId().toHexString()}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.NOT_FOUND)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 500 when database error occurs', async () => {
      // Arrange
      const { form } = await dbHandler.insertEncryptForm({
        formOptions: {
          authType: FormAuthType.SP,
          status: FormStatus.Public,
          esrvcId: new ObjectId().toHexString(),
        },
      })
      const expectedResponse = jsonParseStringify({
        message: 'Sorry, something went wrong. Please try again.',
      })
      jest
        .spyOn(FormService, 'retrieveFullFormById')
        .mockReturnValueOnce(errAsync(new DatabaseError()))

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 500 when the redirect url could not be created', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.SP,
          status: FormStatus.Public,
          esrvcId: new ObjectId().toHexString(),
        },
      })
      const expectedResponse = jsonParseStringify({
        message: 'Sorry, something went wrong. Please try again.',
      })
      jest
        .spyOn(SpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockReturnValueOnce(errAsync(new CreateRedirectUrlError()))

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.body).toEqual(expectedResponse)
    })
  })
})
