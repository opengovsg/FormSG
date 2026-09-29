import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { FormAuthType } from 'formsg-shared/types'
import { err, errAsync, ok, okAsync } from 'neverthrow'

import config from 'src/app/config/config'
import * as FormService from 'src/app/modules/form/form.service'
import { MOCK_COOKIE_AGE } from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'
import * as MrfService from 'src/app/modules/submission/multirespondent-submission/multirespondent-submission.service'
import {
  setCpStepBindingCookie,
  verifyMrfStepAuthCookie,
} from 'src/app/modules/submission/multirespondent-submission/step-auth'
import {
  IMultirespondentSubmissionSchema,
  IPopulatedForm,
  IPopulatedMultirespondentForm,
} from 'src/types'

import * as BillingService from '../../billing/billing.service'
import { DatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import * as SpcpController from '../spcp.controller'
import {
  CreateJwtError,
  InvalidIdTokenError,
  InvalidStateError,
  MissingAttributesError,
} from '../spcp.errors'
import { CpOidcServiceClass } from '../spcp.oidc.service/spcp.oidc.service.cp'
import { SpOidcServiceClass } from '../spcp.oidc.service/spcp.oidc.service.sp'
import { CodeVerifierCookieName, JwtName } from '../spcp.types'

import {
  MOCK_CODE_VERIFIER_COOKIE_OPTIONS,
  MOCK_COOKIE_SETTINGS,
  MOCK_CP_FORM,
  MOCK_CP_OIDC_AUTHORISATION_CODE,
  MOCK_CP_OIDC_EXTRACTED_NDI_PAYLOAD,
  MOCK_CP_OIDC_JWT_PAYLOAD,
  MOCK_DESTINATION,
  MOCK_JWT,
  MOCK_LOGIN_DOC,
  MOCK_NRIC,
  MOCK_OIDC_STATE,
  MOCK_REMEMBER_ME,
  MOCK_SP_FORM,
  MOCK_SP_OIDC_AUTHORISATION_CODE,
  MOCK_SP_OIDC_EXTRACTED_NDI_PAYLOAD,
  MOCK_SP_OIDC_JWT_PAYLOAD,
  MOCK_TARGET,
  MOCK_UEN,
} from './spcp.test.constants'

jest.mock('../spcp.oidc.client')

jest.mock('../spcp.oidc.service/spcp.oidc.service.sp')
const MockSpOidcServiceClass = jest.mocked(SpOidcServiceClass)
jest.mock('../spcp.oidc.service/spcp.oidc.service.cp')
const MockCpOidcServiceClass = jest.mocked(CpOidcServiceClass)

const { SpcpOidcServiceClass: ActualSpcpOidcServiceClass } = jest.requireActual(
  '../spcp.oidc.service/spcp.oidc.service.base',
) as typeof import('../spcp.oidc.service/spcp.oidc.service.base')
jest.mock('../../billing/billing.service')
const MockBillingService = jest.mocked(BillingService)
jest.mock('src/app/modules/form/form.service')
const MockFormService = jest.mocked(FormService)
jest.mock(
  'src/app/modules/submission/multirespondent-submission/multirespondent-submission.service',
)
const MockMrfService = jest.mocked(MrfService)
jest.mock('src/app/config/config')
const MockConfig = jest.mocked(config)
MockConfig.isDevOrTest = false

const MOCK_RESPONSE = expressHandler.mockResponse()

const MOCK_SP_CODE_VERIFIER = 'mockSpCodeVerifier'
const MOCK_CP_CODE_VERIFIER = 'mockCpCodeVerifier'

const MOCK_SPOIDC_LOGIN_REQ = expressHandler.mockRequest({
  query: { state: MOCK_OIDC_STATE, code: MOCK_SP_OIDC_AUTHORISATION_CODE },
  cookies: { [CodeVerifierCookieName.SP]: MOCK_SP_CODE_VERIFIER },
})
const MOCK_CPOIDC_LOGIN_REQ = expressHandler.mockRequest({
  query: { state: MOCK_OIDC_STATE, code: MOCK_CP_OIDC_AUTHORISATION_CODE },
  cookies: { [CodeVerifierCookieName.CP]: MOCK_CP_CODE_VERIFIER },
})
const MOCK_CPOIDC_LOGIN_REQ_NO_CODE_VERIFIER = expressHandler.mockRequest({
  query: { state: MOCK_OIDC_STATE, code: MOCK_CP_OIDC_AUTHORISATION_CODE },
})

describe('spcp.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('handleSpcpOidcLogin', () => {
    describe('(Singpass)', () => {
      const loginHandler = SpcpController.handleSpcpOidcLogin(FormAuthType.SP)

      const mockSpOidcServiceClass = jest.mocked(
        MockSpOidcServiceClass.mock.instances[0],
      )

      beforeEach(() => {
        mockSpOidcServiceClass.exchangeAuthCodeAndRetrieveData.mockReturnValue(
          okAsync(MOCK_SP_OIDC_EXTRACTED_NDI_PAYLOAD),
        )

        mockSpOidcServiceClass.parseState.mockReturnValue(
          ok({
            formId: MOCK_TARGET,
            destination: MOCK_DESTINATION,
            rememberMe: MOCK_REMEMBER_ME,
            cookieDuration: MOCK_COOKIE_AGE,
          }),
        )

        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(MOCK_SP_FORM),
        )

        mockSpOidcServiceClass.createJWTPayload.mockReturnValue(
          ok(MOCK_SP_OIDC_JWT_PAYLOAD),
        )
        mockSpOidcServiceClass.createJWT.mockResolvedValue(ok(MOCK_JWT))
        MockBillingService.recordLoginByForm.mockReturnValue(
          okAsync(MOCK_LOGIN_DOC),
        )
        mockSpOidcServiceClass.getCookieSettings.mockReturnValue(
          MOCK_COOKIE_SETTINGS,
        )
        mockSpOidcServiceClass.getCodeVerifierCookieOptions.mockReturnValue(
          MOCK_CODE_VERIFIER_COOKIE_OPTIONS,
        )
        mockSpOidcServiceClass.codeVerifierCookieName =
          CodeVerifierCookieName.SP
        mockSpOidcServiceClass.extractCodeVerifier.mockImplementation(
          (cookies) => cookies[CodeVerifierCookieName.SP],
        )
        mockSpOidcServiceClass.getCodeVerifierCookieName.mockImplementation(
          ActualSpcpOidcServiceClass.prototype.getCodeVerifierCookieName,
        )
      })

      it('should set the cookie with the correct params and redirect to the destination', async () => {
        // Arrange
        mockSpOidcServiceClass.jwtName = JwtName.SP

        // Act
        await loginHandler(MOCK_SPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert
        expect(
          mockSpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_SP_OIDC_AUTHORISATION_CODE,
          MOCK_SP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockSpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(mockSpOidcServiceClass.createJWTPayload).toHaveBeenCalledWith(
          MOCK_SP_OIDC_EXTRACTED_NDI_PAYLOAD,
          MOCK_REMEMBER_ME,
        )
        expect(mockSpOidcServiceClass.createJWT).toHaveBeenCalledWith(
          MOCK_SP_OIDC_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
        )
        expect(MockBillingService.recordLoginByForm).toHaveBeenCalledWith(
          MOCK_SP_FORM,
        )

        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('jwtSp', MOCK_JWT, {
          maxAge: MOCK_COOKIE_AGE,
          httpOnly: true,
          sameSite: 'lax',
          secure: !MockConfig.isDevOrTest,
          ...MOCK_COOKIE_SETTINGS,
        })
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MOCK_RESPONSE.clearCookie).toHaveBeenCalledWith(
          CodeVerifierCookieName.SP,
          expect.anything(),
        )
      })

      it('should return 400 when token exchange fails', async () => {
        // Arrange

        mockSpOidcServiceClass.exchangeAuthCodeAndRetrieveData.mockReturnValue(
          errAsync(new InvalidIdTokenError()),
        )

        // Act
        await loginHandler(MOCK_SPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert
        expect(
          mockSpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_SP_OIDC_AUTHORISATION_CODE,
          MOCK_SP_CODE_VERIFIER,
        )
        expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(400)
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
        expect(MockFormService.retrieveFullFormById).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(mockSpOidcServiceClass.createJWTPayload).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.createJWT).not.toHaveBeenCalled()
        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      })

      it('should return 400 when parse state fails', async () => {
        // Arrange

        mockSpOidcServiceClass.parseState.mockReturnValueOnce(
          err(new InvalidStateError()),
        )

        // Act
        await loginHandler(MOCK_SPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert
        expect(
          mockSpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(400)
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
        expect(MockFormService.retrieveFullFormById).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.createJWTPayload).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.createJWT).not.toHaveBeenCalled()
        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      })

      it('should return 404 when form cannot be found', async () => {
        // Arrange

        MockFormService.retrieveFullFormById.mockReturnValueOnce(
          errAsync(new FormNotFoundError()),
        )

        // Act

        await loginHandler(MOCK_SPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert
        expect(
          mockSpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_SP_OIDC_AUTHORISATION_CODE,
          MOCK_SP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockSpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(404)
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.createJWTPayload).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.createJWT).not.toHaveBeenCalled()
        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when form has wrong auth type', async () => {
        // Arrange
        MockFormService.retrieveFullFormById.mockReturnValue(
          // Note that this is a CorpPass form
          okAsync(MOCK_CP_FORM),
        )

        // Act
        await loginHandler(MOCK_SPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert
        expect(
          mockSpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_SP_OIDC_AUTHORISATION_CODE,
          MOCK_SP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockSpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(mockSpOidcServiceClass.createJWTPayload).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.createJWT).not.toHaveBeenCalled()
        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when createJWTPayload errors', async () => {
        // Arrange
        mockSpOidcServiceClass.createJWTPayload.mockReturnValue(
          err(new MissingAttributesError()),
        )

        // Act
        await loginHandler(MOCK_SPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert

        expect(
          mockSpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_SP_OIDC_AUTHORISATION_CODE,
          MOCK_SP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockSpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(mockSpOidcServiceClass.createJWTPayload).toHaveBeenCalledWith(
          MOCK_SP_OIDC_EXTRACTED_NDI_PAYLOAD,
          MOCK_REMEMBER_ME,
        )

        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(mockSpOidcServiceClass.createJWT).not.toHaveBeenCalled()
        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when createJWT errors', async () => {
        // Arrange
        mockSpOidcServiceClass.createJWT.mockReturnValue(
          errAsync(new CreateJwtError()),
        )

        // Act
        await loginHandler(MOCK_SPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert

        expect(
          mockSpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_SP_OIDC_AUTHORISATION_CODE,
          MOCK_SP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockSpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(mockSpOidcServiceClass.createJWTPayload).toHaveBeenCalledWith(
          MOCK_SP_OIDC_EXTRACTED_NDI_PAYLOAD,
          MOCK_REMEMBER_ME,
        )

        expect(mockSpOidcServiceClass.createJWT).toHaveBeenCalledWith(
          MOCK_SP_OIDC_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)

        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockSpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when recordLoginByForm errors', async () => {
        // Arrange
        MockBillingService.recordLoginByForm.mockReturnValue(
          errAsync(new DatabaseError()),
        )

        // Act
        await loginHandler(MOCK_SPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert

        expect(
          mockSpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_SP_OIDC_AUTHORISATION_CODE,
          MOCK_SP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockSpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(mockSpOidcServiceClass.createJWTPayload).toHaveBeenCalledWith(
          MOCK_SP_OIDC_EXTRACTED_NDI_PAYLOAD,
          MOCK_REMEMBER_ME,
        )

        expect(mockSpOidcServiceClass.createJWT).toHaveBeenCalledWith(
          MOCK_SP_OIDC_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)

        expect(MockBillingService.recordLoginByForm).toHaveBeenCalledWith(
          MOCK_SP_FORM,
        )
        expect(mockSpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
      })
    })
    describe('(Corppass)', () => {
      const loginHandler = SpcpController.handleSpcpOidcLogin(FormAuthType.CP)

      const mockCpOidcServiceClass = jest.mocked(
        MockCpOidcServiceClass.mock.instances[0],
      )

      beforeEach(() => {
        mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData.mockReturnValue(
          okAsync(MOCK_CP_OIDC_EXTRACTED_NDI_PAYLOAD),
        )

        mockCpOidcServiceClass.parseState.mockReturnValue(
          ok({
            formId: MOCK_TARGET,
            destination: MOCK_DESTINATION,
            rememberMe: MOCK_REMEMBER_ME,
            cookieDuration: MOCK_COOKIE_AGE,
          }),
        )

        MockFormService.retrieveFullFormById.mockReturnValue(
          okAsync(MOCK_CP_FORM),
        )

        mockCpOidcServiceClass.createJWTPayload.mockReturnValue(
          ok(MOCK_CP_OIDC_JWT_PAYLOAD),
        )
        mockCpOidcServiceClass.createJWT.mockResolvedValue(ok(MOCK_JWT))
        MockBillingService.recordLoginByForm.mockReturnValue(
          okAsync(MOCK_LOGIN_DOC),
        )
        mockCpOidcServiceClass.getCookieSettings.mockReturnValue(
          MOCK_COOKIE_SETTINGS,
        )
        mockCpOidcServiceClass.getCodeVerifierCookieOptions.mockReturnValue(
          MOCK_CODE_VERIFIER_COOKIE_OPTIONS,
        )
        mockCpOidcServiceClass.codeVerifierCookieName =
          CodeVerifierCookieName.CP
        mockCpOidcServiceClass.extractCodeVerifier.mockImplementation(
          (cookies) => cookies[CodeVerifierCookieName.CP],
        )
        mockCpOidcServiceClass.getCodeVerifierCookieName.mockImplementation(
          ActualSpcpOidcServiceClass.prototype.getCodeVerifierCookieName,
        )
      })

      it('should set the cookie with the correct params and redirect to the destination', async () => {
        // Arrange
        mockCpOidcServiceClass.jwtName = JwtName.CP

        // Act
        await loginHandler(MOCK_CPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert
        expect(
          mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_CP_OIDC_AUTHORISATION_CODE,
          MOCK_CP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockCpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(mockCpOidcServiceClass.createJWTPayload).toHaveBeenCalledWith(
          MOCK_CP_OIDC_EXTRACTED_NDI_PAYLOAD,
          MOCK_REMEMBER_ME,
        )
        expect(mockCpOidcServiceClass.createJWT).toHaveBeenCalledWith(
          MOCK_CP_OIDC_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
        )
        expect(MockBillingService.recordLoginByForm).toHaveBeenCalledWith(
          MOCK_CP_FORM,
        )

        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('jwtCp', MOCK_JWT, {
          maxAge: MOCK_COOKIE_AGE,
          httpOnly: true,
          sameSite: 'lax',
          secure: !MockConfig.isDevOrTest,
          ...MOCK_COOKIE_SETTINGS,
        })
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(MOCK_RESPONSE.clearCookie).toHaveBeenCalledWith(
          CodeVerifierCookieName.CP,
          expect.anything(),
        )
      })

      it('should return 400 when token exchange fails', async () => {
        // Arrange

        mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData.mockReturnValue(
          errAsync(new InvalidIdTokenError()),
        )

        // Act
        await loginHandler(MOCK_CPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert
        expect(
          mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_CP_OIDC_AUTHORISATION_CODE,
          MOCK_CP_CODE_VERIFIER,
        )
        expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(400)
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
        expect(MockFormService.retrieveFullFormById).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(mockCpOidcServiceClass.createJWTPayload).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.createJWT).not.toHaveBeenCalled()
        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      })

      it('should proceed without code_verifier and still redirect when code verifier cookie is missing (backward compatibility with pre-PKCE in-flight logins)', async () => {
        // Arrange
        mockCpOidcServiceClass.jwtName = JwtName.CP

        // Act
        await loginHandler(
          MOCK_CPOIDC_LOGIN_REQ_NO_CODE_VERIFIER,
          MOCK_RESPONSE,
          jest.fn(),
        )

        // Assert
        expect(
          mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(MOCK_CP_OIDC_AUTHORISATION_CODE, undefined)
        expect(MOCK_RESPONSE.clearCookie).toHaveBeenCalledWith(
          CodeVerifierCookieName.CP,
          expect.anything(),
        )
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
      })

      it('should return 400 when parse state fails', async () => {
        // Arrange

        mockCpOidcServiceClass.parseState.mockReturnValueOnce(
          err(new InvalidStateError()),
        )

        // Act
        await loginHandler(MOCK_CPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert
        expect(
          mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(400)
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
        expect(MockFormService.retrieveFullFormById).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.createJWTPayload).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.createJWT).not.toHaveBeenCalled()
        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      })

      it('should return 404 when form cannot be found', async () => {
        // Arrange

        MockFormService.retrieveFullFormById.mockReturnValueOnce(
          errAsync(new FormNotFoundError()),
        )

        // Act

        await loginHandler(MOCK_CPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert
        expect(
          mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_CP_OIDC_AUTHORISATION_CODE,
          MOCK_CP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockCpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(MOCK_RESPONSE.sendStatus).toHaveBeenCalledWith(404)
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.redirect).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.createJWTPayload).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.createJWT).not.toHaveBeenCalled()
        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
        expect(MOCK_RESPONSE.cookie).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when form has wrong auth type', async () => {
        // Arrange
        MockFormService.retrieveFullFormById.mockReturnValue(
          // Note that this is a SingPass form
          okAsync(MOCK_SP_FORM),
        )

        // Act
        await loginHandler(MOCK_CPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert
        expect(
          mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_CP_OIDC_AUTHORISATION_CODE,
          MOCK_CP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockCpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(mockCpOidcServiceClass.createJWTPayload).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.createJWT).not.toHaveBeenCalled()
        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when createJWTPayload errors', async () => {
        // Arrange
        mockCpOidcServiceClass.createJWTPayload.mockReturnValue(
          err(new MissingAttributesError()),
        )

        // Act
        await loginHandler(MOCK_CPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert

        expect(
          mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_CP_OIDC_AUTHORISATION_CODE,
          MOCK_CP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockCpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(mockCpOidcServiceClass.createJWTPayload).toHaveBeenCalledWith(
          MOCK_CP_OIDC_EXTRACTED_NDI_PAYLOAD,
          MOCK_REMEMBER_ME,
        )

        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)
        expect(mockCpOidcServiceClass.createJWT).not.toHaveBeenCalled()
        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when createJWT errors', async () => {
        // Arrange
        mockCpOidcServiceClass.createJWT.mockReturnValue(
          errAsync(new CreateJwtError()),
        )

        // Act
        await loginHandler(MOCK_CPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert

        expect(
          mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_CP_OIDC_AUTHORISATION_CODE,
          MOCK_CP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockCpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(mockCpOidcServiceClass.createJWTPayload).toHaveBeenCalledWith(
          MOCK_CP_OIDC_EXTRACTED_NDI_PAYLOAD,
          MOCK_REMEMBER_ME,
        )

        expect(mockCpOidcServiceClass.createJWT).toHaveBeenCalledWith(
          MOCK_CP_OIDC_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)

        expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
        expect(mockCpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
      })

      it('should set isLoginError cookie and redirect when recordLoginByForm errors', async () => {
        // Arrange
        MockBillingService.recordLoginByForm.mockReturnValue(
          errAsync(new DatabaseError()),
        )

        // Act
        await loginHandler(MOCK_CPOIDC_LOGIN_REQ, MOCK_RESPONSE, jest.fn())

        // Assert

        expect(
          mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
        ).toHaveBeenCalledWith(
          MOCK_CP_OIDC_AUTHORISATION_CODE,
          MOCK_CP_CODE_VERIFIER,
        )
        expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
          MOCK_TARGET,
        )
        expect(mockCpOidcServiceClass.parseState).toHaveBeenCalledWith(
          MOCK_OIDC_STATE,
        )
        expect(mockCpOidcServiceClass.createJWTPayload).toHaveBeenCalledWith(
          MOCK_CP_OIDC_EXTRACTED_NDI_PAYLOAD,
          MOCK_REMEMBER_ME,
        )

        expect(mockCpOidcServiceClass.createJWT).toHaveBeenCalledWith(
          MOCK_CP_OIDC_JWT_PAYLOAD,
          MOCK_COOKIE_AGE,
        )
        expect(MOCK_RESPONSE.cookie).toHaveBeenCalledWith('isLoginError', true)
        expect(MOCK_RESPONSE.redirect).toHaveBeenCalledWith(MOCK_DESTINATION)

        expect(MockBillingService.recordLoginByForm).toHaveBeenCalledWith(
          MOCK_CP_FORM,
        )
        expect(mockCpOidcServiceClass.getCookieSettings).not.toHaveBeenCalled()
      })

      describe('login for a later MRF step', () => {
        const NONCE = 'c'.repeat(32)
        const SUBMISSION_ID = new ObjectId().toHexString()
        const STEP_TOKEN_HASH = 'step-token-hash'
        const CONTEXT = {
          formId: MOCK_TARGET,
          submissionId: SUBMISSION_ID,
          workflowStep: 1,
          stepTokenHash: STEP_TOKEN_HASH,
          authType: FormAuthType.CP as const,
        }
        const EDIT_DESTINATION = `/${MOCK_TARGET}/edit/${SUBMISSION_ID}?queryId=abc`
        // Step 1 has no login; only the submission copy protects step 2.
        const MRF_FORM = {
          ...MOCK_CP_FORM,
          _id: MOCK_TARGET,
          authType: FormAuthType.NIL,
          esrvcId: 'live-esrvc-id',
          responseMode: 'multirespondent',
        }
        const makeSubmission = (overrides = {}) => ({
          _id: SUBMISSION_ID,
          form: MOCK_TARGET,
          workflowStep: 0,
          stepTokenHash: STEP_TOKEN_HASH,
          esrvcId: 'snapshot-esrvc-id',
          form_fields: [],
          submittedSteps: [],
          workflow: [
            { edit: [] },
            {
              edit: [],
              auth: {
                auth_type: FormAuthType.CP,
                is_submitter_id_collection_enabled: true,
              },
            },
          ],
          ...overrides,
        })
        const mintBinding = (context = CONTEXT) => {
          const res = expressHandler.mockResponse()
          setCpStepBindingCookie(res, context, NONCE)
          return jest.mocked(res.cookie).mock.calls[0][1] as string
        }
        const makeRequest = (binding: string) =>
          expressHandler.mockRequest({
            query: { state: 'state', code: MOCK_CP_OIDC_AUTHORISATION_CODE },
            cookies: {
              [`${CodeVerifierCookieName.CP}_${NONCE}`]: MOCK_CP_CODE_VERIFIER,
              [`cpStepBinding_${NONCE}`]: binding,
              // A legacy Corppass session never unlocks the step.
              [JwtName.CP]: 'legacy-jwt',
            },
          })
        const stepCookieName = `mrfStepAuth_${MOCK_TARGET}_${SUBMISSION_ID}`
        const findStepCookie = (res: typeof MOCK_RESPONSE) =>
          jest
            .mocked(res.cookie)
            .mock.calls.find(([name]) => name === stepCookieName)

        beforeEach(() => {
          mockCpOidcServiceClass.parseState.mockReturnValue(
            ok({
              formId: MOCK_TARGET,
              destination: `/${MOCK_TARGET}?queryId=abc`,
              rememberMe: false,
              cookieDuration: MOCK_COOKIE_AGE,
              nonce: NONCE,
            }),
          )
          mockCpOidcServiceClass.extractCodeVerifier.mockImplementation(
            (cookies, nonce) =>
              cookies[`${CodeVerifierCookieName.CP}_${nonce}`],
          )
          mockCpOidcServiceClass.getCookieDuration.mockReturnValue(
            MOCK_COOKIE_AGE,
          )
          MockFormService.retrieveFullFormById.mockReturnValue(
            okAsync(MRF_FORM as unknown as IPopulatedForm),
          )
          MockMrfService.checkFormIsMultirespondent.mockImplementation((form) =>
            ok(form as IPopulatedMultirespondentForm),
          )
          MockMrfService.getMultirespondentSubmission.mockReturnValue(
            okAsync(
              makeSubmission() as unknown as IMultirespondentSubmissionSchema,
            ),
          )
        })

        it("should set only that step's session and return to the submission", async () => {
          const res = expressHandler.mockResponse()

          await loginHandler(makeRequest(mintBinding()), res, jest.fn())

          expect(
            mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
          ).toHaveBeenCalledWith(
            MOCK_CP_OIDC_AUTHORISATION_CODE,
            MOCK_CP_CODE_VERIFIER,
          )
          expect(MockBillingService.recordLoginByForm).toHaveBeenCalledWith(
            MRF_FORM,
            { authType: FormAuthType.CP, esrvcId: 'snapshot-esrvc-id' },
          )
          const stepCookie = findStepCookie(res)
          expect((stepCookie as unknown[] | undefined)?.[2]).toMatchObject({
            path: `/api/v3/forms/${MOCK_TARGET}`,
            httpOnly: true,
          })
          expect(
            verifyMrfStepAuthCookie(
              { [stepCookieName]: stepCookie?.[1] as string },
              CONTEXT,
            )._unsafeUnwrap(),
          ).toMatchObject({ userName: MOCK_UEN, userInfo: MOCK_NRIC })
          expect(res.cookie).not.toHaveBeenCalledWith(
            JwtName.CP,
            expect.anything(),
            expect.anything(),
          )
          expect(mockCpOidcServiceClass.createJWT).not.toHaveBeenCalled()
          expect(res.clearCookie).toHaveBeenCalledWith(
            `cpStepBinding_${NONCE}`,
            expect.anything(),
          )
          expect(res.redirect).toHaveBeenCalledWith(EDIT_DESTINATION)
        })

        it('should reject a tampered binding before exchanging the code', async () => {
          const res = expressHandler.mockResponse()
          const [header, , signature] = mintBinding().split('.')
          const forgedPayload = Buffer.from(
            JSON.stringify({ ...CONTEXT, submissionId: 'other', nonce: NONCE }),
          ).toString('base64url')

          await loginHandler(
            makeRequest(`${header}.${forgedPayload}.${signature}`),
            res,
            jest.fn(),
          )

          expect(res.sendStatus).toHaveBeenCalledWith(400)
          expect(
            mockCpOidcServiceClass.exchangeAuthCodeAndRetrieveData,
          ).not.toHaveBeenCalled()
          expect(res.redirect).not.toHaveBeenCalled()
          expect(res.clearCookie).toHaveBeenCalledWith(
            `cpStepBinding_${NONCE}`,
            expect.anything(),
          )
        })

        it.each([
          ['has advanced', { workflowStep: 1 }],
          ['has a new step token', { stepTokenHash: 'new-step-token-hash' }],
        ])(
          'should not log in when the submission %s since login started',
          async (_, change) => {
            MockMrfService.getMultirespondentSubmission.mockReturnValue(
              okAsync(
                makeSubmission(
                  change,
                ) as unknown as IMultirespondentSubmissionSchema,
              ),
            )
            const res = expressHandler.mockResponse()

            await loginHandler(makeRequest(mintBinding()), res, jest.fn())

            expect(findStepCookie(res)).toBeUndefined()
            expect(MockBillingService.recordLoginByForm).not.toHaveBeenCalled()
            expect(res.cookie).toHaveBeenCalledWith('isLoginError', true)
            expect(res.redirect).toHaveBeenCalledWith(EDIT_DESTINATION)
          },
        )
      })
    })
  })
})
