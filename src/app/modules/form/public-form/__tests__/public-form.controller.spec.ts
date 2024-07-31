import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { IPersonResponse } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson'
import { Request } from 'express'
import { err, errAsync, ok, okAsync } from 'neverthrow'

import { DatabaseError } from 'src/app/modules/core/core.errors'
import {
  MOCK_ACCESS_TOKEN,
  MOCK_AUTH_CODE,
} from 'src/app/modules/myinfo/__tests__/myinfo.test.constants'
import { MyInfoData } from 'src/app/modules/myinfo/myinfo.adapter'
import {
  MyInfoCircuitBreakerError,
  MyInfoFetchError,
} from 'src/app/modules/myinfo/myinfo.errors'
import {
  MyInfoAuthCodeCookieState,
  MyInfoForm,
} from 'src/app/modules/myinfo/myinfo.types'
import { MOCK_LOGIN_DOC } from 'src/app/modules/spcp/__tests__/spcp.test.constants'
import { JwtPayload, SpcpForm } from 'src/app/modules/spcp/spcp.types'
import {
  IFormDocument,
  IPopulatedEncryptedForm,
  IPopulatedForm,
  IPopulatedUser,
  PublicForm,
} from 'src/types'

import {
  ErrorCode,
  FormAuthType,
  MyInfoAttribute,
} from '../../../../../../shared/types'
import * as AuthService from '../../../auth/auth.service'
import * as BillingService from '../../../billing/billing.service'
import {
  MYINFO_AUTH_CODE_COOKIE_NAME,
  MYINFO_LOGIN_COOKIE_NAME,
} from '../../../myinfo/myinfo.constants'
import { MyInfoService } from '../../../myinfo/myinfo.service'
import { SGID_COOKIE_NAME } from '../../../sgid/sgid.constants'
import {
  CreateRedirectUrlError,
  MissingJwtError,
} from '../../../spcp/spcp.errors'
import { CpOidcServiceClass } from '../../../spcp/spcp.oidc.service/spcp.oidc.service.cp'
import { SpOidcServiceClass } from '../../../spcp/spcp.oidc.service/spcp.oidc.service.sp'
import { JwtName } from '../../../spcp/spcp.types'
import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
  FormNotFoundError,
  PrivateFormError,
} from '../../form.errors'
import * as FormService from '../../form.service'
import * as PublicFormController from '../public-form.controller'
import * as PublicFormService from '../public-form.service'
import { getCookieNameByAuthType } from '../public-form.service'

jest.mock('../public-form.service')
jest.mock('../../form.service')
jest.mock('../../../auth/auth.service')
jest.mock('../../../spcp/spcp.oidc.service/spcp.oidc.service.sp')
jest.mock('../../../spcp/spcp.oidc.service/spcp.oidc.service.cp')
jest.mock('../../../myinfo/myinfo.service')
jest.mock('../../../billing/billing.service')

const MockFormService = jest.mocked(FormService)
const MockPublicFormService = jest.mocked(PublicFormService)
const MockAuthService = jest.mocked(AuthService)

const MockMyInfoService = jest.mocked(MyInfoService)
const MockBillingService = jest.mocked(BillingService)

describe('public-form.controller', () => {
  afterEach(() => jest.clearAllMocks())

  describe('handleGetPublicForm', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_USER_ID = new ObjectId().toHexString()
    const MOCK_USER = {
      _id: MOCK_USER_ID,
      email: 'randomrandomtest@example.com',
    } as IPopulatedUser

    const MOCK_SCRUBBED_FORM = {
      _id: MOCK_FORM_ID,
      title: 'mock title',
      admin: { _id: MOCK_USER_ID },
    } as unknown as PublicForm

    const BASE_FORM = {
      admin: MOCK_USER,
      _id: MOCK_FORM_ID,
      title: MOCK_SCRUBBED_FORM.title,
      getUniqueMyInfoAttrs: jest.fn().mockReturnValue([MyInfoAttribute.Name]),
      getPublicView: jest.fn().mockReturnValue(MOCK_SCRUBBED_FORM),
    }

    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        formId: MOCK_FORM_ID,
      },
      others: {
        cookies: {},
      },
    })

    const MOCK_MYINFO_AUTH_CODE_COOKIE = {
      code: MOCK_AUTH_CODE,
      state: MyInfoAuthCodeCookieState.Success,
    }

    let mockReqWithCookies: Request<{
      formId: string
    }>

    beforeEach(() => {
      mockReqWithCookies = expressHandler.mockRequest({
        params: {
          formId: MOCK_FORM_ID,
        },
        others: {
          cookies: {
            [MYINFO_AUTH_CODE_COOKIE_NAME]: MOCK_MYINFO_AUTH_CODE_COOKIE,
          },
        },
      })
    })

    // Success
    describe('valid form id', () => {
      const MOCK_JWT_PAYLOAD: JwtPayload = {
        userName: 'mock',
        rememberMe: false,
      }

      beforeAll(() => {
        MockFormService.checkIsIntranetFormAccess.mockReturnValue(false)
        MockFormService.checkHasSingleSubmissionValidationFailure.mockReturnValue(
          okAsync(false),
        )
        MockFormService.checkHasRespondentNotWhitelistedFailure.mockReturnValue(
          okAsync(false),
        )
      })

      it('should return 200 when there is no FormAuthType on the request', async () => {
        // Arrange
        const MOCK_NIL_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.NIL,
        } as unknown as IPopulatedForm
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_NIL_AUTH_FORM.getPublicView(),
          isIntranetUser: false,
        })
      })

      it('should return 200 when client authenticates using SP', async () => {
        // Arrange
        const MOCK_SPCP_SESSION = {
          userName: MOCK_JWT_PAYLOAD.userName,
          exp: 1000000000,
          iat: 100000000,
          rememberMe: false,
        }
        const MOCK_SP_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.SP,
        } as unknown as IPopulatedForm
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )

        jest
          .spyOn(SpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(okAsync(MOCK_SPCP_SESSION))

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_SP_AUTH_FORM.getPublicView(),
          isIntranetUser: false,
          spcpSession: MOCK_SPCP_SESSION,
        })
      })

      it('should return 200 when client authenticates using CP', async () => {
        // Arrange
        const MOCK_SPCP_SESSION = {
          userName: MOCK_JWT_PAYLOAD.userName,
          exp: 1000000000,
          iat: 100000000,
          rememberMe: false,
        }
        const MOCK_CP_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.CP,
        } as unknown as IPopulatedForm
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )
        jest
          .spyOn(CpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(okAsync(MOCK_SPCP_SESSION))
        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_CP_AUTH_FORM.getPublicView(),
          isIntranetUser: false,
          spcpSession: MOCK_SPCP_SESSION,
        })
      })

      it('should return 200 when client authenticates using MyInfo', async () => {
        // Arrange
        const MOCK_MYINFO_AUTH_FORM = {
          ...BASE_FORM,
          esrvcId: 'thing',
          authType: FormAuthType.MyInfo,
          toJSON: jest.fn().mockReturnValue(BASE_FORM),
        } as unknown as IPopulatedForm
        const MOCK_MYINFO_DATA = new MyInfoData({
          uinFin: 'i am a fish',
        } as IPersonResponse)
        const MOCK_SPCP_SESSION = { userName: MOCK_MYINFO_DATA.getUinFin() }
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
          cookie: jest.fn().mockReturnThis(),
        })
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM),
        )
        MockMyInfoService.retrieveAccessToken.mockReturnValueOnce(
          okAsync(MOCK_ACCESS_TOKEN),
        )
        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_DATA),
        )
        MockBillingService.recordLoginByForm.mockReturnValueOnce(
          okAsync(MOCK_LOGIN_DOC),
        )
        MockMyInfoService.prefillAndSaveMyInfoFields.mockReturnValueOnce(
          okAsync([]),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.cookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: { ...MOCK_MYINFO_AUTH_FORM.getPublicView(), form_fields: [] },
          spcpSession: MOCK_SPCP_SESSION,
          isIntranetUser: false,
        })
      })
    })

    describe('success cases for submitterId whitelisting', () => {
      it('should return 200 ok without any failure flags when user is whitelisted', async () => {
        // Arrange
        MockFormService.checkHasRespondentNotWhitelistedFailure.mockReturnValueOnce(
          okAsync(false),
        )
        const MOCK_MYINFO_AUTH_FORM_WITH_WHITELIST_ENABLED = {
          ...BASE_FORM,
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.MyInfo,
          whitelistedSubmitterIds: {
            isWhitelistEnabled: true,
          },
          toJSON: jest.fn().mockReturnValue(BASE_FORM),
        } as unknown as IPopulatedEncryptedForm
        const MOCK_MYINFO_DATA = new MyInfoData({
          uinFin: 'mockUinFin',
        } as IPersonResponse)
        const MOCK_SPCP_SESSION = { userName: MOCK_MYINFO_DATA.getUinFin() }
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
          cookie: jest.fn().mockReturnThis(),
        })
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM_WITH_WHITELIST_ENABLED),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM_WITH_WHITELIST_ENABLED),
        )
        MockMyInfoService.retrieveAccessToken.mockReturnValueOnce(
          okAsync(MOCK_ACCESS_TOKEN),
        )
        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_DATA),
        )
        MockBillingService.recordLoginByForm.mockReturnValueOnce(
          okAsync(MOCK_LOGIN_DOC),
        )
        MockMyInfoService.prefillAndSaveMyInfoFields.mockReturnValueOnce(
          okAsync([]),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.cookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: {
            ...MOCK_MYINFO_AUTH_FORM_WITH_WHITELIST_ENABLED.getPublicView(),
            form_fields: [],
          },
          spcpSession: MOCK_SPCP_SESSION,
          isIntranetUser: false,
        })
      })
    })

    // Errors
    describe('errors in myInfo', () => {
      const MOCK_MYINFO_FORM = {
        ...BASE_FORM,
        toJSON: jest.fn().mockReturnThis(),
        authType: FormAuthType.MyInfo,
      } as unknown as IPopulatedForm

      // Setup because this gets invoked at the start of the controller to decide which branch to take
      beforeEach(() => {
        MockAuthService.getFormIfPublic.mockReturnValue(
          okAsync(MOCK_MYINFO_FORM),
        )

        MockFormService.checkIsIntranetFormAccess.mockReturnValue(false)
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValue(
          okAsync(MOCK_MYINFO_FORM),
        )

        MockMyInfoService.retrieveAccessToken.mockReturnValue(
          okAsync(MOCK_ACCESS_TOKEN),
        )

        MockBillingService.recordLoginByForm.mockReturnValue(
          okAsync(MOCK_LOGIN_DOC),
        )
      })

      it('should return 200 but the response should have cookies cleared with no myInfoError when the request has no auth code cookie', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the cookie cannot be validated', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })
        const mockReq = expressHandler.mockRequest({
          params: {
            formId: MOCK_FORM_ID,
          },
          others: {
            cookies: {
              [MYINFO_AUTH_CODE_COOKIE_NAME]: 'nonsense',
            },
          },
        })

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReq,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          errorCodes: [ErrorCode.myInfo],
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the access token cannot be retrieved', async () => {
        // Arrange
        // 1. Mock the response and calls
        MockMyInfoService.retrieveAccessToken.mockReturnValueOnce(
          errAsync(new MyInfoCircuitBreakerError()),
        )
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })
        const mockReq = expressHandler.mockRequest({
          params: {
            formId: MOCK_FORM_ID,
          },
          others: {
            cookies: {
              [MYINFO_AUTH_CODE_COOKIE_NAME]: MOCK_MYINFO_AUTH_CODE_COOKIE,
            },
          },
        })

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReq,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          errorCodes: [ErrorCode.myInfo],
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError if the form cannot be validated', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          errAsync(
            new AuthTypeMismatchError(FormAuthType.MyInfo, FormAuthType.CP),
          ),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          errorCodes: [ErrorCode.myInfo],
          isIntranetUser: false,
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the form has no eservcId', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          errAsync(new FormAuthNoEsrvcIdError('anything')),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          errorCodes: [ErrorCode.myInfo],
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError when the form could not be filled', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })

        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          errAsync(new MyInfoFetchError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          errorCodes: [ErrorCode.myInfo],
        })
      })

      it('should return 200 but the response should have cookies cleared and myInfoError if a database error occurs while saving hashes', async () => {
        // Arrange
        // 1. Mock the response and calls
        const MOCK_MYINFO_DATA = new MyInfoData({
          uinFin: 'i am a fish',
        } as IPersonResponse)
        const expected = new DatabaseError('fish error')
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
        })
        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_DATA),
        )
        MockMyInfoService.prefillAndSaveMyInfoFields.mockReturnValueOnce(
          errAsync(expected),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.clearCookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_MYINFO_FORM.getPublicView(),
          isIntranetUser: false,
          errorCodes: [ErrorCode.myInfo],
        })
      })
    })

    describe('errors in spcp', () => {
      const MOCK_SP_FORM = {
        ...BASE_FORM,
        authType: FormAuthType.SP,
      } as unknown as IPopulatedForm
      const MOCK_CP_FORM = {
        ...BASE_FORM,
        authType: FormAuthType.CP,
      } as unknown as IPopulatedForm
      it('should return 200 with the form but without a spcpSession when the JWT token could not be found for SP form', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SP_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SP_FORM),
        )
        jest
          .spyOn(SpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(errAsync(new MissingJwtError()))

        // Act
        // 2. GET the endpoint
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        // Status should be 200
        // json object should only have form property
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_SP_FORM.getPublicView(),
          isIntranetUser: false,
        })
      })

      it('should return 200 with the form but without a spcpSession when the JWT token could not be found for CP form', async () => {
        // Arrange
        // 1. Mock the response and calls
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_CP_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_CP_FORM),
        )
        jest
          .spyOn(CpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(errAsync(new MissingJwtError()))

        // Act
        // 2. GET the endpoint
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        // Status should be 200
        // json object should only have form property
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_CP_FORM.getPublicView(),
          isIntranetUser: false,
        })
      })
    })

    describe('errors due to submitterId whitelisting', () => {
      it('should return 200 but with respondent not whitelisted failure flag when submitterId is not in whitelist', async () => {
        // Arrange
        MockFormService.checkHasRespondentNotWhitelistedFailure.mockReturnValueOnce(
          okAsync(true),
        )
        const MOCK_MYINFO_AUTH_FORM_WITH_WHITELIST_ENABLED = {
          ...BASE_FORM,
          esrvcId: 'mockEsrvcId',
          authType: FormAuthType.MyInfo,
          whitelistedSubmitterIds: {
            isWhitelistEnabled: true,
          },
          toJSON: jest.fn().mockReturnValue(BASE_FORM),
        } as unknown as IPopulatedEncryptedForm
        const MOCK_MYINFO_DATA = new MyInfoData({
          uinFin: 'mockUinFin',
        } as IPersonResponse)
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
          cookie: jest.fn().mockReturnThis(),
        })
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM_WITH_WHITELIST_ENABLED),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM_WITH_WHITELIST_ENABLED),
        )
        MockMyInfoService.retrieveAccessToken.mockReturnValueOnce(
          okAsync(MOCK_ACCESS_TOKEN),
        )
        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_DATA),
        )
        MockBillingService.recordLoginByForm.mockReturnValueOnce(
          okAsync(MOCK_LOGIN_DOC),
        )
        MockMyInfoService.prefillAndSaveMyInfoFields.mockReturnValueOnce(
          okAsync([]),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert that user is logged out and myInfo fields are not passed
        expect(mockRes.json).toHaveBeenCalledWith({
          form: {
            ...MOCK_MYINFO_AUTH_FORM_WITH_WHITELIST_ENABLED.getPublicView(),
          },
          isIntranetUser: false,
          errorCodes: [ErrorCode.respondentNotWhitelisted],
        })
      })
    })

    describe('errors due to single submission per submitterId violation', () => {
      const MOCK_SP_FORM = {
        ...BASE_FORM,
        authType: FormAuthType.SP,
      } as unknown as IPopulatedForm
      const MOCK_SPCP_SESSION = {
        userName: 'submitterId',
        exp: 1000000000,
        iat: 100000000,
        rememberMe: false,
      }
      it('should return 200 but with single submission validation failure flag when submitterId already submitted for form id', async () => {
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SP_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SP_FORM),
        )
        jest
          .spyOn(SpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(okAsync(MOCK_SPCP_SESSION))

        const checkHasSingleSubmissionValidationFailureSpy = jest
          .spyOn(MockFormService, 'checkHasSingleSubmissionValidationFailure')
          .mockResolvedValueOnce(okAsync(true))

        const mockRes = expressHandler.mockResponse()

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert that the submitterId is hashed when compared
        expect(
          checkHasSingleSubmissionValidationFailureSpy.mock.calls[0][1],
        ).toEqual(
          '151c329a583a82e4a768f16ab8c9b7ae621fcfdea574e87925dd56d7f73e367d',
        )

        // Assert that status is not set, which defaults to intended 200 ok
        expect(mockRes.status).not.toHaveBeenCalled()
        // Assert that the form details is still returned so that FE can populate the title
        expect((mockRes.json as jest.Mock).mock.calls[0][0].form).toEqual(
          MOCK_SP_FORM.getPublicView(),
        )
        // Assert that the response contains the single submission validation failure flag
        expect((mockRes.json as jest.Mock).mock.calls[0][0].errorCodes).toEqual(
          [ErrorCode.respondentSingleSubmissionValidationFailure],
        )

        // Assert user is logged out
        expect((mockRes.json as jest.Mock).mock.calls[0][0]).not.toContainKey(
          'spcpSession',
        )
        expect(mockRes.clearCookie).toHaveBeenCalledOnceWith(
          getCookieNameByAuthType(FormAuthType.SP),
        )
      })
    })

    describe('errors in form retrieval', () => {
      const MOCK_ERROR_STRING = 'mockingbird'

      it('should return 500 when a database error occurs', async () => {
        // Arrange
        // 1. Mock the response
        const mockRes = expressHandler.mockResponse()

        // 2. Mock the call to retrieve the form
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          errAsync(new DatabaseError(MOCK_ERROR_STRING)),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        // 1. Check args of mocked services
        expect(MockAuthService.getFormIfPublic).toHaveBeenCalledWith(
          MOCK_FORM_ID,
        )
        // 2. Check that error is correct
        expect(
          MockFormService.checkFormSubmissionLimitAndDeactivateForm,
        ).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({
          message: MOCK_ERROR_STRING,
        })
      })

      it('should return 404 when the form is not found', async () => {
        // Arrange
        // 1. Mock the response
        const mockRes = expressHandler.mockResponse()

        // 2. Mock the call to retrieve the form
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          errAsync(new FormNotFoundError()),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        // 1. Check args of mocked services
        expect(MockAuthService.getFormIfPublic).toHaveBeenCalledWith(
          MOCK_FORM_ID,
        )
        // 2. Check that error is correct
        expect(
          MockFormService.checkFormSubmissionLimitAndDeactivateForm,
        ).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(404)
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Form not found',
        })
      })

      it('should return 404 when the form is private and not accessible by the public', async () => {
        // Arrange
        // 1. Mock the response
        const mockRes = expressHandler.mockResponse()
        const MOCK_FORM_TITLE = 'private form'

        // 2. Mock the call to retrieve the form
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          errAsync(new PrivateFormError(MOCK_ERROR_STRING, MOCK_FORM_TITLE)),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        // 1. Check args of mocked services
        expect(MockAuthService.getFormIfPublic).toHaveBeenCalledWith(
          MOCK_FORM_ID,
        )
        // 2. Check that error is correct
        expect(
          MockFormService.checkFormSubmissionLimitAndDeactivateForm,
        ).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(404)
        expect(mockRes.json).toHaveBeenCalledWith({
          message: MOCK_ERROR_STRING,
          formTitle: MOCK_FORM_TITLE,
          isPageFound: true,
        })
      })
    })

    describe('errors in form access', () => {
      const MOCK_SPCP_SESSION = {
        userName: 'mock',
        exp: 1000000000,
        iat: 100000000,
        rememberMe: false,
      }

      it('should return 200 with isIntranetUser set to false when a user accesses a form from outside intranet', async () => {
        // Arrange
        const MOCK_NIL_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.NIL,
        } as unknown as IPopulatedForm
        const mockRes = expressHandler.mockResponse()

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_NIL_AUTH_FORM),
        )
        MockFormService.checkIsIntranetFormAccess.mockReturnValueOnce(false)

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_NIL_AUTH_FORM.getPublicView(),
          isIntranetUser: false,
        })
      })

      it('should return 200 with isIntranetUser set to true when a intranet user accesses an FormAuthType.SP form', async () => {
        // Arrange
        const MOCK_SP_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.SP,
        } as unknown as IPopulatedForm

        const mockRes = expressHandler.mockResponse()

        jest
          .spyOn(SpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(okAsync(MOCK_SPCP_SESSION))
        MockFormService.checkIsIntranetFormAccess.mockReturnValueOnce(true)
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_SP_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_SP_AUTH_FORM.getPublicView(),
          spcpSession: MOCK_SPCP_SESSION,
          isIntranetUser: true,
        })
      })

      it('should return 200 with isIntranetUser set to true when a intranet user accesses an FormAuthType.CP form', async () => {
        // Arrange
        const MOCK_CP_AUTH_FORM = {
          ...BASE_FORM,
          authType: FormAuthType.CP,
        } as unknown as IPopulatedForm

        const mockRes = expressHandler.mockResponse()

        MockFormService.checkIsIntranetFormAccess.mockReturnValueOnce(true)
        jest
          .spyOn(CpOidcServiceClass.prototype, 'extractJwtPayloadFromRequest')
          .mockReturnValueOnce(okAsync(MOCK_SPCP_SESSION))
        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_CP_AUTH_FORM),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          form: MOCK_CP_AUTH_FORM.getPublicView(),
          spcpSession: MOCK_SPCP_SESSION,
          isIntranetUser: true,
        })
      })

      it('should return 200 with isIntranetUser set to true when a intranet user accesses an FormAuthType.MyInfo form', async () => {
        // Arrange
        const MOCK_MYINFO_AUTH_FORM = {
          ...BASE_FORM,
          esrvcId: 'thing',
          authType: FormAuthType.MyInfo,
          toJSON: jest.fn().mockReturnValue(BASE_FORM),
        } as unknown as IPopulatedForm
        const mockRes = expressHandler.mockResponse({
          clearCookie: jest.fn().mockReturnThis(),
          cookie: jest.fn().mockReturnThis(),
        })

        const MOCK_MYINFO_DATA = new MyInfoData({
          uinFin: 'i am a fish',
        } as IPersonResponse)

        MockAuthService.getFormIfPublic.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_AUTH_FORM),
        )
        MockFormService.checkIsIntranetFormAccess.mockReturnValueOnce(true)
        MockMyInfoService.retrieveAccessToken.mockReturnValueOnce(
          okAsync(MOCK_ACCESS_TOKEN),
        )
        MockMyInfoService.getMyInfoDataForForm.mockReturnValueOnce(
          okAsync(MOCK_MYINFO_DATA),
        )
        MockBillingService.recordLoginByForm.mockReturnValueOnce(
          okAsync(MOCK_LOGIN_DOC),
        )
        MockMyInfoService.prefillAndSaveMyInfoFields.mockReturnValueOnce(
          okAsync([]),
        )

        // Act
        await PublicFormController.handleGetPublicForm(
          mockReqWithCookies,
          mockRes,
          jest.fn(),
        )

        // Assert
        expect(mockRes.cookie).toHaveBeenCalled()
        expect(mockRes.json).toHaveBeenCalledWith({
          form: { ...MOCK_MYINFO_AUTH_FORM.getPublicView(), form_fields: [] },
          spcpSession: { userName: MOCK_MYINFO_DATA.getUinFin() },
          isIntranetUser: true,
        })
      })
    })
  })

  describe('_handleFormAuthRedirect', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        formId: new ObjectId().toHexString(),
      },
      query: {
        isPersistentLogin: true,
      },
    })
    const MOCK_REDIRECT_URL = 'www.mockata.com'

    it('should return 200 with the redirect url when the request is valid and the form has authType SP', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormDocument>
      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(SpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockResolvedValueOnce(ok(MOCK_REDIRECT_URL))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 200 with the redirect url when the request is valid, form has authType SP and isPersistentLogin is undefined', async () => {
      // Arrange
      const MOCK_REQ_WITHOUT_PERSISTENT_LOGIN = expressHandler.mockRequest({
        params: {
          formId: new ObjectId().toHexString(),
        },
      })
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormDocument>
      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(SpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockResolvedValueOnce(ok(MOCK_REDIRECT_URL))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ_WITHOUT_PERSISTENT_LOGIN,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 200 with the redirect url when the request is valid, form has authType SP and isPersistentLogin is false', async () => {
      // Arrange
      const MOCK_REQ_WITH_FALSE_PERSISTENT_LOGIN = expressHandler.mockRequest({
        params: {
          formId: new ObjectId().toHexString(),
        },
        query: {
          isPersistentLogin: false,
        },
      })
      const MOCK_FORM = {
        authType: FormAuthType.SP,
        esrvcId: '12345',
      } as SpcpForm<IFormDocument>
      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(SpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockResolvedValueOnce(ok(MOCK_REDIRECT_URL))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ_WITH_FALSE_PERSISTENT_LOGIN,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 200 with the redirect url when the request is valid and the form has authType CP', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.CP,
        esrvcId: '12345',
      } as SpcpForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(CpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockReturnValueOnce(okAsync(MOCK_REDIRECT_URL))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 200 with the redirect url when the request is valid and the form has authType MyInfo', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.MyInfo,
        esrvcId: '12345',
        getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
      } as unknown as MyInfoForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      MockMyInfoService.createRedirectURL.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 400 when the form has authType NIL', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.NIL,
        esrvcId: '12345',
      } as IFormDocument

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'Please ensure that the form has authentication enabled. Please refresh and try again.',
      })
    })

    it('should return 400 when the form has authType MyInfo and is missing esrvcId', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.MyInfo,
      } as unknown as MyInfoForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'This form does not have a valid eServiceId. Please refresh and try again.',
      })
    })

    it('should return 400 when the form has authType SP and is missing esrvcId', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.SP,
      } as unknown as SpcpForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'This form does not have a valid eServiceId. Please refresh and try again.',
      })
    })

    it('should return 400 when the form has authType CP and is missing esrvcId', async () => {
      // Arrange
      const MOCK_FORM = {
        authType: FormAuthType.CP,
      } as unknown as SpcpForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'This form does not have a valid eServiceId. Please refresh and try again.',
      })
    })

    it('should return 500 when the form could not be retrieved from the database', async () => {
      // Arrange

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Sorry, something went wrong. Please try again.',
      })
    })

    it('should return 500 when the redirectURL could not be created for SP form', async () => {
      // Arrange
      const MOCK_FORM = {
        esrvcId: '234',
        authType: FormAuthType.SP,
      } as unknown as SpcpForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(SpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockResolvedValue(err(new CreateRedirectUrlError()))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Sorry, something went wrong. Please try again.',
      })
    })

    it('should return 500 when the redirectURL could not be created for CP form', async () => {
      // Arrange
      const MOCK_FORM = {
        esrvcId: '234',
        authType: FormAuthType.CP,
      } as unknown as SpcpForm<IFormDocument>

      const mockRes = expressHandler.mockResponse()
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_FORM),
      )
      jest
        .spyOn(CpOidcServiceClass.prototype, 'createRedirectUrl')
        .mockReturnValueOnce(errAsync(new CreateRedirectUrlError()))

      // Act
      await PublicFormController._handleFormAuthRedirect(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Sorry, something went wrong. Please try again.',
      })
    })
  })

  describe('handlePublicAuthLogout', () => {
    it('should return 200 if authType is SP and call clearCookie()', async () => {
      const authType = FormAuthType.SP as const
      MockPublicFormService.getCookieNameByAuthType.mockReturnValueOnce(
        JwtName[authType],
      )
      const mockReq = expressHandler.mockRequest({
        params: {
          authType,
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      await PublicFormController._handlePublicAuthLogout(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.clearCookie).toHaveBeenCalledWith(JwtName[authType])
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully logged out.',
      })
    })

    it('should return 200 if authType is CP and call clearCookie()', async () => {
      const authType = FormAuthType.CP as const
      MockPublicFormService.getCookieNameByAuthType.mockReturnValueOnce(
        JwtName[authType],
      )
      const mockReq = expressHandler.mockRequest({
        params: {
          authType,
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      await PublicFormController._handlePublicAuthLogout(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.clearCookie).toHaveBeenCalledWith(JwtName[authType])
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully logged out.',
      })
    })

    it('should return 200 if authType is MyInfo and call clearCookie()', async () => {
      const authType = FormAuthType.MyInfo as const
      MockPublicFormService.getCookieNameByAuthType.mockReturnValueOnce(
        MYINFO_LOGIN_COOKIE_NAME,
      )
      const mockReq = expressHandler.mockRequest({
        params: {
          authType,
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      await PublicFormController._handlePublicAuthLogout(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.clearCookie).toHaveBeenCalledWith(MYINFO_LOGIN_COOKIE_NAME)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully logged out.',
      })
    })

    it('should return 200 if authType is SGID and call clearCookie()', async () => {
      const authType = FormAuthType.SGID as const
      MockPublicFormService.getCookieNameByAuthType.mockReturnValueOnce(
        SGID_COOKIE_NAME,
      )
      const mockReq = expressHandler.mockRequest({
        params: {
          authType,
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      await PublicFormController._handlePublicAuthLogout(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.clearCookie).toHaveBeenCalledWith(SGID_COOKIE_NAME)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Successfully logged out.',
      })
    })
  })
})
