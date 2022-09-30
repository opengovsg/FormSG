import axios from 'axios'
import { ObjectId } from 'bson-ext'
import { StatusCodes } from 'http-status-codes'
import { err, errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'
import { mocked } from 'ts-jest/utils'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import { getRedirectTargetSpcpOidc } from 'src/app/modules/spcp/spcp.util'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { jsonParseStringify } from 'tests/unit/backend/helpers/serialize-data'

import { FormAuthType, FormStatus } from '../../../../../../../shared/types'
import * as FormService from '../../../../../modules/form/form.service'
import {
  CreateRedirectUrlError,
  FetchLoginPageError,
} from '../../../../../modules/spcp/spcp.errors'
import {
  CpOidcClient,
  SpOidcClient,
} from '../../../../../modules/spcp/spcp.oidc.client'
import { SpOidcServiceClass } from '../../../../../modules/spcp/spcp.oidc.service/spcp.oidc.service.sp'
import { PublicFormsRouter } from '../public-forms.routes'

// NOTE: Mocking axios here because there is a network call to an external service
// to validate the result of eserviceId.
jest.mock('axios')
const MockAxios = mocked(axios, true)

jest.mock('../../../../../modules/spcp/spcp.oidc.client')

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

    it('should return 200 with the redirect URL when the form is valid and has authType MyInfo', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.MyInfo,
          status: FormStatus.Public,
          esrvcId: new ObjectId().toHexString(),
        },
      })

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.OK)
      expect(response.body).toMatchObject({
        redirectURL: expect.toIncludeMultiple([
          String(form._id),
          form.esrvcId!,
        ]),
      })
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

    it('should return 400 with the redirect URL when the form has no esrvcId', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.MyInfo,
          status: FormStatus.Public,
        },
      })
      const expectedResponse = jsonParseStringify({
        message:
          'This form does not have a valid eServiceId. Please refresh and try again.',
      })

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.BAD_REQUEST)
      expect(response.body).toEqual(expectedResponse)
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
        .mockResolvedValueOnce(err(new CreateRedirectUrlError()))

      // Act
      const response = await request
        .get(`/forms/${form._id}/auth/redirect`)
        .query({ isPersistentLogin: false })

      // Assert
      expect(response.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
      expect(response.body).toEqual(expectedResponse)
    })
  })

  describe('GET /forms/:formId/auth/validate', () => {
    it('should return 200 with isValid set to true when the form has valid eSrvcId', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.SP,
          esrvcId: new ObjectId().toHexString(),
          status: FormStatus.Public,
        },
      })
      MockAxios.get.mockResolvedValueOnce({ data: '<title> </title>' })
      const expectedResponse = jsonParseStringify({ isValid: true })

      // Act
      const response = await request.get(`/forms/${form._id}/auth/validate`)

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 200 with isValid set to false when the form has an invalid eSrvcId', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.SP,
          esrvcId: new ObjectId().toHexString(),
          status: FormStatus.Public,
        },
      })
      MockAxios.get.mockResolvedValueOnce({
        data: '<title> error system code:&nbsp;<b>138</b>  </title>',
      })
      const expectedResponse = jsonParseStringify({
        isValid: false,
        errorCode: '138',
      })

      // Act
      const response = await request.get(`/forms/${form._id}/auth/validate`)

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 400 when the form has FormAuthType.NIL', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.NIL,
          esrvcId: new ObjectId().toHexString(),
          status: FormStatus.Public,
        },
      })
      const expectedResponse = jsonParseStringify({
        message:
          'Please ensure that the form has authentication enabled. Please refresh and try again.',
      })

      // Act
      const response = await request.get(`/forms/${form._id}/auth/validate`)

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 400 when the form has FormAuthType.CP', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.CP,
          esrvcId: new ObjectId().toHexString(),
          status: FormStatus.Public,
        },
      })
      const expectedResponse = jsonParseStringify({
        message:
          'Please ensure that the form has authentication enabled. Please refresh and try again.',
      })

      // Act
      const response = await request.get(`/forms/${form._id}/auth/validate`)

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 400 when the form does not have an eSrvcId', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.SP,
          status: FormStatus.Public,
        },
      })
      const expectedResponse = jsonParseStringify({
        message:
          'This form does not have a valid eServiceId. Please refresh and try again.',
      })

      // Act
      const response = await request.get(`/forms/${form._id}/auth/validate`)

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when the form does not exist', async () => {
      // Arrange
      const expectedResponse = jsonParseStringify({
        message:
          'Could not find the form requested. Please refresh and try again.',
      })

      // Act
      const response = await request.get(
        `/forms/${new ObjectId().toHexString()}/auth/validate`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 502 when the fetched login page has no title', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.SP,
          esrvcId: new ObjectId().toHexString(),
          status: FormStatus.Public,
        },
      })
      MockAxios.get.mockResolvedValueOnce({
        data: '',
      })
      const expectedResponse = jsonParseStringify({
        message: 'Error while contacting SingPass. Please try again.',
      })

      // Act
      const response = await request.get(`/forms/${form._id}/auth/validate`)

      // Assert
      expect(response.status).toEqual(502)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 500 when a database error occurs', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.SP,
          esrvcId: new ObjectId().toHexString(),
          status: FormStatus.Public,
        },
      })
      jest
        .spyOn(FormService, 'retrieveFormById')
        .mockReturnValueOnce(errAsync(new DatabaseError()))

      const expectedResponse = jsonParseStringify({
        message: 'Sorry, something went wrong. Please try again.',
      })

      // Act
      const response = await request.get(`/forms/${form._id}/auth/validate`)

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 503 when the singpass login page could not be fetched', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          authType: FormAuthType.SP,
          esrvcId: new ObjectId().toHexString(),
          status: FormStatus.Public,
        },
      })
      MockAxios.get.mockRejectedValueOnce(new FetchLoginPageError())
      const expectedResponse = jsonParseStringify({
        message: 'Failed to contact SingPass. Please try again.',
      })

      // Act
      const response = await request.get(`/forms/${form._id}/auth/validate`)

      // Assert
      expect(response.status).toEqual(503)
      expect(response.body).toEqual(expectedResponse)
    })
  })
})
