import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { merge } from 'lodash'
import mongoose from 'mongoose'
import { ok, okAsync } from 'neverthrow'
import {
  FORM_RESPONDENT_NOT_WHITELISTED_ERROR_MESSAGE,
  FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE,
} from 'shared/constants/errors'
import {
  BasicField,
  ErrorCode,
  FormAuthType,
  MyInfoAttribute,
} from 'shared/types'

import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import * as FormService from 'src/app/modules/form/form.service'
import { MyInfoService } from 'src/app/modules/myinfo/myinfo.service'
import * as MyInfoUtil from 'src/app/modules/myinfo/myinfo.util'
import { SgidService } from 'src/app/modules/sgid/sgid.service'
import * as OidcService from 'src/app/modules/spcp/spcp.oidc.service/index'
import { OidcServiceType } from 'src/app/modules/spcp/spcp.oidc.service/spcp.oidc.service.types'
import * as EncryptSubmissionService from 'src/app/modules/submission/encrypt-submission/encrypt-submission.service'
import * as VerifiedContentService from 'src/app/modules/verified-content/verified-content.service'
import {
  EncryptVerificationContentParams,
  SpVerifiedContent,
} from 'src/app/modules/verified-content/verified-content.types'
import MailService from 'src/app/services/mail/mail.service'
import { FormFieldSchema, IPopulatedEncryptedForm } from 'src/types'
import { EncryptSubmissionDto, FormCompleteDto } from 'src/types/api'

import { SubmissionEmailObj } from '../../email-submission/email-submission.util'
import { ProcessedFieldResponse } from '../../submission.types'
import {
  generateHashedSubmitterId,
  getCookieNameByAuthType,
} from '../../submission.utils'
import { submitEncryptModeFormForTest } from '../encrypt-submission.controller'
import {
  EncryptSubmissionContent,
  SubmitEncryptModeFormHandlerRequest,
} from '../encrypt-submission.types'

jest.mock('src/app/modules/datadog/datadog.utils')
jest.mock('src/app/utils/pipeline-middleware', () => {
  const MockPipeline = jest.fn().mockImplementation(() => {
    return {
      execute: jest.fn(() => {
        return okAsync(true)
      }),
    }
  })

  return {
    Pipeline: MockPipeline,
  }
})
jest.mock('src/app/modules/spcp/spcp.oidc.service')
jest.mock('src/app/modules/myinfo/myinfo.util')
jest.mock('src/app/modules/myinfo/myinfo.service')
jest.mock('src/app/modules/sgid/sgid.service')
jest.mock('src/app/services/mail/mail.service')
jest.mock('src/app/modules/verified-content/verified-content.service', () => {
  const originalModule = jest.requireActual(
    'src/app/modules/verified-content/verified-content.service',
  )
  return {
    ...originalModule,
    getVerifiedContent: jest.fn(originalModule.getVerifiedContent),
    encryptVerifiedContent: jest.fn(
      ({ verifiedContent }: EncryptVerificationContentParams) =>
        ok(JSON.stringify(verifiedContent as SpVerifiedContent)),
    ),
  }
})

const MockOidcService = jest.mocked(OidcService)
const MockSgidService = jest.mocked(SgidService)
const MockMyInfoUtil = jest.mocked(MyInfoUtil)
const MockMyInfoService = jest.mocked(MyInfoService)
const MockMailService = jest.mocked(MailService)
const MockVerifiedContentService = jest.mocked(VerifiedContentService)

const EncryptSubmission = getEncryptSubmissionModel(mongoose)

describe('encrypt-submission.controller', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.clearAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('submitterId', () => {
    const MOCK_JWT_PAYLOAD = {
      userName: 'submitterId',
      rememberMe: false,
    }
    const MOCK_COOKIE_TIMESTAMP = {
      iat: 1,
      exp: 1,
    }
    beforeEach(() => {
      MockOidcService.getOidcService.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwt: (_arg1) => ok('jwt'),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwtPayload: (_arg1) =>
          okAsync(merge(MOCK_JWT_PAYLOAD, MOCK_COOKIE_TIMESTAMP)),
      } as OidcServiceType<FormAuthType.SP>)

      MockMailService.sendSubmissionToAdmin.mockResolvedValue(okAsync(true))
    })

    it('should have same submitterId if same uen but different nric for corppass', async () => {
      // Arrange
      const saveIfSubmitterIdIsUniqueSpy = jest
        .spyOn(EncryptSubmission, 'saveIfSubmitterIdIsUnique')
        .mockResolvedValueOnce(null)
      const UEN = 'uen'
      const NRIC_1 = 'S1234567A'
      const NRIC_2 = 'S1234567B'
      const MOCK_JWT_PAYLOAD_1 = {
        userName: UEN,
        userInfo: NRIC_1,
        rememberMe: false,
      }
      const MOCK_JWT_PAYLOAD_2 = {
        userName: UEN,
        userInfo: NRIC_2,
        rememberMe: false,
      }
      MockOidcService.getOidcService.mockReset()
      MockOidcService.getOidcService
        .mockReturnValueOnce({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwt: (_arg1) => ok('jwt'),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwtPayload: (_arg1) =>
            okAsync(merge(MOCK_JWT_PAYLOAD_1, MOCK_COOKIE_TIMESTAMP)),
        } as OidcServiceType<FormAuthType.CP>)
        .mockReturnValueOnce({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwt: (_arg1) => ok('jwt'),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwtPayload: (_arg1) =>
            okAsync(merge(MOCK_JWT_PAYLOAD_2, MOCK_COOKIE_TIMESTAMP)),
        } as OidcServiceType<FormAuthType.CP>)

      const mockFormId = new ObjectId()
      const mockCpAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.CP,
        isSingleSubmission: true,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.CP,
            },
            encryptedFormDef: mockCpAuthTypeAndIsSingleSubmissionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert
      expect(saveIfSubmitterIdIsUniqueSpy).toHaveBeenCalledTimes(2)
      expect(saveIfSubmitterIdIsUniqueSpy.mock.calls[0][1]).toEqual(
        saveIfSubmitterIdIsUniqueSpy.mock.calls[1][1],
      )
      expect(saveIfSubmitterIdIsUniqueSpy.mock.calls[0][2].submitterId).toEqual(
        saveIfSubmitterIdIsUniqueSpy.mock.calls[1][2].submitterId,
      )
    })

    it('should have different submitterId if different uen but same nric for corppass', async () => {
      // Arrange
      const saveIfSubmitterIdIsUniqueSpy = jest
        .spyOn(EncryptSubmission, 'saveIfSubmitterIdIsUnique')
        .mockResolvedValueOnce(null)
      const UEN_1 = 'uen1'
      const UEN_2 = 'uen2'
      const NRIC = 'S1234567A'
      const MOCK_JWT_PAYLOAD_1 = {
        userName: UEN_1,
        userInfo: NRIC,
        rememberMe: false,
      }
      const MOCK_JWT_PAYLOAD_2 = {
        userName: UEN_2,
        userInfo: NRIC,
        rememberMe: false,
      }
      MockOidcService.getOidcService.mockReset()
      MockOidcService.getOidcService
        .mockReturnValueOnce({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwt: (_arg1) => ok('jwt'),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwtPayload: (_arg1) =>
            okAsync(merge(MOCK_JWT_PAYLOAD_1, MOCK_COOKIE_TIMESTAMP)),
        } as OidcServiceType<FormAuthType.CP>)
        .mockReturnValueOnce({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwt: (_arg1) => ok('jwt'),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwtPayload: (_arg1) =>
            okAsync(merge(MOCK_JWT_PAYLOAD_2, MOCK_COOKIE_TIMESTAMP)),
        } as OidcServiceType<FormAuthType.CP>)

      const mockFormId = new ObjectId()
      const mockCpAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.CP,
        isSingleSubmission: true,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.CP,
            },
            encryptedFormDef: mockCpAuthTypeAndIsSingleSubmissionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert
      expect(saveIfSubmitterIdIsUniqueSpy).toHaveBeenCalledTimes(2)
      expect(saveIfSubmitterIdIsUniqueSpy.mock.calls[0][1]).not.toEqual(
        saveIfSubmitterIdIsUniqueSpy.mock.calls[1][1],
      )
      expect(
        saveIfSubmitterIdIsUniqueSpy.mock.calls[0][2].submitterId,
      ).not.toEqual(saveIfSubmitterIdIsUniqueSpy.mock.calls[1][2].submitterId)
    })

    it('should hash submitterId for SP form', async () => {
      // Arrange
      const saveIfSubmitterIdIsUniqueSpy = jest
        .spyOn(EncryptSubmission, 'saveIfSubmitterIdIsUnique')
        .mockResolvedValueOnce(null)

      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        id: mockFormId.toHexString(),
        title: 'some form',
        authType: FormAuthType.SP,
        isSingleSubmission: true,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndIsSingleSubmissionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert that submitterId is uppercased and then hashed
      expect(saveIfSubmitterIdIsUniqueSpy).toHaveBeenCalledTimes(1)
      expect(saveIfSubmitterIdIsUniqueSpy.mock.calls[0][1]).toEqual(
        generateHashedSubmitterId(
          MOCK_JWT_PAYLOAD.userName.toUpperCase(),
          mockSpAuthTypeAndIsSingleSubmissionEnabledForm.id,
        ),
      )
      expect(saveIfSubmitterIdIsUniqueSpy.mock.calls[0][2].submitterId).toEqual(
        generateHashedSubmitterId(
          MOCK_JWT_PAYLOAD.userName.toUpperCase(),
          mockSpAuthTypeAndIsSingleSubmissionEnabledForm.id,
        ),
      )
    })

    it('should hash submitterId for CP form', async () => {
      // Arrange
      const MOCK_JWT_PAYLOAD = {
        userName: 'uen',
        userInfo: 'S1234567A',
        rememberMe: false,
      }
      MockOidcService.getOidcService.mockReset()
      MockOidcService.getOidcService.mockReturnValueOnce({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwt: (_arg1) => ok('jwt'),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwtPayload: (_arg1) =>
          okAsync(merge(MOCK_JWT_PAYLOAD, MOCK_COOKIE_TIMESTAMP)),
      } as OidcServiceType<FormAuthType.CP>)

      const saveIfSubmitterIdIsUniqueSpy = jest
        .spyOn(EncryptSubmission, 'saveIfSubmitterIdIsUnique')
        .mockResolvedValueOnce(null)

      const mockFormId = new ObjectId()
      const mockCpAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        id: mockFormId.toHexString(),
        title: 'some form',
        authType: FormAuthType.CP,
        isSingleSubmission: true,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.CP,
            },
            encryptedFormDef: mockCpAuthTypeAndIsSingleSubmissionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert that submitterId is uppercased then hashed
      expect(saveIfSubmitterIdIsUniqueSpy).toHaveBeenCalledTimes(1)
      expect(saveIfSubmitterIdIsUniqueSpy.mock.calls[0][1]).toEqual(
        generateHashedSubmitterId(
          MOCK_JWT_PAYLOAD.userName.toUpperCase(),
          mockCpAuthTypeAndIsSingleSubmissionEnabledForm.id,
        ),
      )
      expect(saveIfSubmitterIdIsUniqueSpy.mock.calls[0][2].submitterId).toEqual(
        generateHashedSubmitterId(
          MOCK_JWT_PAYLOAD.userName.toUpperCase(),
          mockCpAuthTypeAndIsSingleSubmissionEnabledForm.id,
        ),
      )
    })
  })

  describe('submitterId whitelisting', () => {
    const MOCK_JWT_PAYLOAD = {
      userName: 'submitterId',
      rememberMe: false,
    }
    const MOCK_COOKIE_TIMESTAMP = {
      iat: 1,
      exp: 1,
    }
    beforeEach(() => {
      MockOidcService.getOidcService.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwt: (_arg1) => ok('jwt'),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwtPayload: (_arg1) =>
          okAsync(merge(MOCK_JWT_PAYLOAD, MOCK_COOKIE_TIMESTAMP)),
      } as OidcServiceType<FormAuthType.SP>)

      MockMailService.sendSubmissionToAdmin.mockResolvedValue(okAsync(true))
    })

    it('should return 200 ok when successfully submit form and submitterId is whitelisted', async () => {
      // Arrange
      const checkHasRespondentNotWhitelistedFailureSpy = jest
        .spyOn(FormService, 'checkHasRespondentNotWhitelistedFailure')
        .mockReturnValue(okAsync(false))
      const checkHasSingleSubmissionValidationFailureSpy = jest
        .spyOn(FormService, 'checkHasSingleSubmissionValidationFailure')
        .mockReturnValue(okAsync(false))
      const performEncryptPostSubmissionActionsSpy = jest.spyOn(
        EncryptSubmissionService,
        'performEncryptPostSubmissionActions',
      )
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isSingleSubmission: false,
        whitelistedSubmitterIds: {
          isWhitelistEnabled: true,
        },
        form_fields: [] as FormFieldSchema[],
        emails: ['test@example.com'],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndIsSingleSubmissionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert that only whitelist failure validation is run for whitelist enabled but single submission disabled settings
      expect(checkHasRespondentNotWhitelistedFailureSpy).toHaveBeenCalledTimes(
        1,
      )
      expect(
        checkHasSingleSubmissionValidationFailureSpy,
      ).not.toHaveBeenCalled()

      // Assert email notification should be sent
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(1)

      // Assert that status is not called, which defaults to intended 200 OK
      expect(mockRes.status).not.toHaveBeenCalled()
      // Assert that response does not any error codes
      expect(
        (mockRes.json as jest.Mock).mock.calls[0][0].errorCodes,
      ).not.toBeDefined()

      expect(performEncryptPostSubmissionActionsSpy).toHaveBeenCalledTimes(1)
    })

    // purpose: used to test that whitelisting and single submission work together
    it('should return 200 ok when successfully submit form and submitterId is whitelisted and no single submission validation error', async () => {
      // Arrange
      const checkHasRespondentNotWhitelistedFailureSpy = jest
        .spyOn(FormService, 'checkHasRespondentNotWhitelistedFailure')
        .mockReturnValue(okAsync(false))
      const saveIfSubmitterIdIsUniqueSpy = jest
        .spyOn(EncryptSubmission, 'saveIfSubmitterIdIsUnique')
        .mockResolvedValueOnce(
          new EncryptSubmission({
            id: 'dummySubmissionId',
          } as unknown as EncryptSubmissionContent),
        )
      const performEncryptPostSubmissionActionsSpy = jest.spyOn(
        EncryptSubmissionService,
        'performEncryptPostSubmissionActions',
      )
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isSingleSubmission: true,
        whitelistedSubmitterIds: {
          isWhitelistEnabled: true,
        },
        form_fields: [] as FormFieldSchema[],
        emails: ['test@example.com'],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndIsSingleSubmissionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert
      expect(checkHasRespondentNotWhitelistedFailureSpy).toHaveBeenCalledTimes(
        1,
      )
      expect(saveIfSubmitterIdIsUniqueSpy).toHaveBeenCalledTimes(1)

      // Assert email notification should be sent
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(1)

      // Assert that status is not called, which defaults to intended 200 OK
      expect(mockRes.status).not.toHaveBeenCalled()
      // Assert that response does not any error codes
      expect(
        (mockRes.json as jest.Mock).mock.calls[0][0].errorCodes,
      ).not.toBeDefined()

      // Assert that user is logged out
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        getCookieNameByAuthType(
          mockSpAuthTypeAndIsSingleSubmissionEnabledForm.authType as FormAuthType.SP,
        ),
      )

      expect(performEncryptPostSubmissionActionsSpy).toHaveBeenCalledTimes(1)
    })

    it('should return 403 with submitterId not whitelisted failure flag when submitterId is not whitelisted', async () => {
      // Arrange
      const checkHasRespondentNotWhitelistedFailureSpy = jest
        .spyOn(FormService, 'checkHasRespondentNotWhitelistedFailure')
        .mockReturnValue(okAsync(true))
      const checkHasSingleSubmissionValidationFailureSpy = jest
        .spyOn(FormService, 'checkHasSingleSubmissionValidationFailure')
        .mockReturnValue(okAsync(false))
      const performEncryptPostSubmissionActionsSpy = jest.spyOn(
        EncryptSubmissionService,
        'performEncryptPostSubmissionActions',
      )
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isSingleSubmission: false,
        whitelistedSubmitterIds: {
          isWhitelistEnabled: true,
        },
        form_fields: [] as FormFieldSchema[],
        emails: ['test@example.com'],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndIsSingleSubmissionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert that the submitterId related validations are run
      expect(checkHasRespondentNotWhitelistedFailureSpy).toHaveBeenCalledTimes(
        1,
      )
      expect(
        checkHasSingleSubmissionValidationFailureSpy,
      ).not.toHaveBeenCalled()

      // Assert email notification not sent since submission not allowed
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(0)

      expect(mockRes.status).toHaveBeenCalledExactlyOnceWith(403)

      expect((mockRes.json as jest.Mock).mock.calls[0][0].message).toEqual(
        FORM_RESPONDENT_NOT_WHITELISTED_ERROR_MESSAGE,
      )

      expect(performEncryptPostSubmissionActionsSpy).not.toHaveBeenCalled()
    })
  })

  describe('single submission per submitterId', () => {
    const MOCK_JWT_PAYLOAD = {
      userName: 'submitterId',
      rememberMe: false,
    }
    const MOCK_COOKIE_TIMESTAMP = {
      iat: 1,
      exp: 1,
    }
    beforeEach(() => {
      MockOidcService.getOidcService.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwt: (_arg1) => ok('jwt'),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwtPayload: (_arg1) =>
          okAsync(merge(MOCK_JWT_PAYLOAD, MOCK_COOKIE_TIMESTAMP)),
      } as OidcServiceType<FormAuthType.SP>)

      MockMailService.sendSubmissionToAdmin.mockResolvedValue(okAsync(true))
    })

    it('should return 200 ok and logout user when successfully submit form with single submission enabled', async () => {
      // Arrange
      jest
        .spyOn(EncryptSubmission, 'saveIfSubmitterIdIsUnique')
        .mockResolvedValueOnce(
          new EncryptSubmission({
            id: 'dummySubmissionId',
          } as unknown as EncryptSubmissionContent),
        )

      const performEncryptPostSubmissionActionsSpy = jest.spyOn(
        EncryptSubmissionService,
        'performEncryptPostSubmissionActions',
      )

      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isSingleSubmission: true,
        form_fields: [] as FormFieldSchema[],
        emails: ['test@example.com'],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndIsSingleSubmissionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert email notification should be sent
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(1)

      // Assert that status is not called, which defaults to intended 200 OK
      expect(mockRes.status).not.toHaveBeenCalled()
      // Assert that response does not have the single submission validation failure flag
      expect(
        (mockRes.json as jest.Mock).mock.calls[0][0].errorCodes,
      ).not.toBeDefined()

      // Assert that user is logged out
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        getCookieNameByAuthType(
          mockSpAuthTypeAndIsSingleSubmissionEnabledForm.authType as FormAuthType.SP,
        ),
      )

      expect(performEncryptPostSubmissionActionsSpy).toHaveBeenCalledTimes(1)
    })
    it('should return json response with single submission validation failure flag when submissionId is not unique and does not save submission', async () => {
      jest
        .spyOn(EncryptSubmission, 'saveIfSubmitterIdIsUnique')
        .mockResolvedValueOnce(null)

      // Arrange
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isSingleSubmission: true,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndIsSingleSubmissionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert that response has the single submission validation failure flag
      expect(mockRes.json).toHaveBeenCalledWith({
        message: FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE,
        errorCodes: [ErrorCode.respondentSingleSubmissionValidationFailure],
      })

      // Assert that the submission is not saved
      expect(await EncryptSubmission.countDocuments()).toEqual(0)
    })

    it('should return json response with single submission validation failure flag when submissionId is not unique and does not save submission even when isSubmitterIdCollectedEnabled is true', async () => {
      jest
        .spyOn(EncryptSubmission, 'saveIfSubmitterIdIsUnique')
        .mockResolvedValueOnce(null)

      // Arrange
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndIsSingleSubmissionEnabledAndIsSubmitterIdCollectionEnabledForm =
        {
          _id: mockFormId,
          title: 'some form',
          authType: FormAuthType.SP,
          isSingleSubmission: true,
          isSubmitterIdCollectionEnabled: true,
          form_fields: [] as FormFieldSchema[],
          getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
        } as IPopulatedEncryptedForm

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef:
              mockSpAuthTypeAndIsSingleSubmissionEnabledAndIsSubmitterIdCollectionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert that response has the single submission validation failure flag
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'You have already submitted a response using this NRIC/FIN/UEN. If you require further assistance, please contact the agency that gave you the form link.',
        errorCodes: [ErrorCode.respondentSingleSubmissionValidationFailure],
      })

      // Assert that the submission is not saved
      expect(await EncryptSubmission.countDocuments()).toEqual(0)
    })
  })

  describe('submitter login ids collection', () => {
    const MOCK_NRIC = 'S1234567A'
    const MOCK_UEN = '123456789A'

    const MOCK_JWT_PAYLOAD = {
      userName: MOCK_NRIC,
      rememberMe: false,
    }
    const MOCK_JWT_CP_PAYLOAD = {
      userName: MOCK_UEN,
      userInfo: MOCK_NRIC,
      rememberMe: false,
    }
    const MOCK_MYINFO_LOGIN_COOKIE_PAYLOAD = {
      uinFin: MOCK_NRIC,
    }
    const MOCK_COOKIE_TIMESTAMP = {
      iat: 1,
      exp: 1,
    }
    beforeEach(() => {
      MockSgidService.extractSgidSingpassJwtPayload.mockReturnValue(
        ok(MOCK_JWT_PAYLOAD),
      )
      MockMyInfoUtil.extractMyInfoLoginJwt.mockReturnValue(ok('jwt'))
      MockMyInfoService.verifyLoginJwt.mockReturnValue(
        ok(MOCK_MYINFO_LOGIN_COOKIE_PAYLOAD),
      )

      MockOidcService.getOidcService.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwt: (_arg1) => ok('jwt'),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwtPayload: (_arg1) =>
          okAsync(merge(MOCK_JWT_PAYLOAD, MOCK_COOKIE_TIMESTAMP)),
      } as OidcServiceType<FormAuthType.SP>)

      MockMailService.sendSubmissionToAdmin.mockResolvedValue(okAsync(true))
    })

    it('should store login nric in verifiedContent if form isSubmitterIdCollectionEnabled is true for SP authType', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndSubmitterIdCollectionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isSubmitterIdCollectionEnabled: true,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const MOCK_REQ = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndSubmitterIdCollectionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()
      const expectedVerifiedContent = { uinFin: MOCK_NRIC, userInfo: undefined }

      // Act
      await submitEncryptModeFormForTest(MOCK_REQ, mockRes)
      // Assert
      // that verified content is generated since submitter login id is collected
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).toHaveBeenCalledWith({
        type: mockSpAuthTypeAndSubmitterIdCollectionEnabledForm.authType,
        data: expectedVerifiedContent,
      })

      // that the saved submission is contains the correct verified content
      const savedSubmission = await EncryptSubmission.findOne()

      expect(savedSubmission).toBeDefined()
      expect(savedSubmission).not.toBeNull()
      expect(savedSubmission?.verifiedContent).toEqual(
        JSON.stringify(expectedVerifiedContent),
      )
    })

    it('should store login nric and uen in verifiedContent if form isSubmitterIdCollectionEnabled is true for CP authType', async () => {
      // Arrange
      MockOidcService.getOidcService.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwt: (_arg1) => ok('jwt'),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwtPayload: (_arg1) =>
          okAsync(merge(MOCK_JWT_CP_PAYLOAD, MOCK_COOKIE_TIMESTAMP)),
      } as OidcServiceType<FormAuthType.CP>)

      const mockFormId = new ObjectId()
      const mockCpAuthTypeAndSubmitterIdCollectionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.CP,
        isSubmitterIdCollectionEnabled: true,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const MOCK_REQ = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.CP,
            },
            encryptedFormDef: mockCpAuthTypeAndSubmitterIdCollectionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()
      const expectedGetVerifiedContentArg = {
        uinFin: MOCK_UEN,
        userInfo: MOCK_NRIC,
      }
      const expectedVerifiedContent = { cpUen: MOCK_UEN, cpUid: MOCK_NRIC }

      // Act
      await submitEncryptModeFormForTest(MOCK_REQ, mockRes)

      // Assert
      // that verified content is generated since submitter login id is collected
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).toHaveBeenCalledWith({
        type: mockCpAuthTypeAndSubmitterIdCollectionEnabledForm.authType,
        data: expectedGetVerifiedContentArg,
      })

      // that the saved submission is contains the correct verified content
      const savedSubmission = await EncryptSubmission.findOne()

      expect(savedSubmission).toBeDefined()
      expect(savedSubmission).not.toBeNull()
      expect(savedSubmission?.verifiedContent).toEqual(
        JSON.stringify(expectedVerifiedContent),
      )
    })

    it('should not collect nric if form isSubmitterIdCollectionEnabled is undefined for SP authType', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndNricMaskingEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const MOCK_REQ = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndNricMaskingEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(MOCK_REQ, mockRes)

      // Assert
      // that verified content is not generated
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).not.toHaveBeenCalled()
      // that the saved submission is does not contain verified content
      const savedSubmission = await EncryptSubmission.findOne()

      expect(savedSubmission).toBeDefined()
      expect(savedSubmission).not.toBeNull()
      expect(savedSubmission!.verifiedContent).toBeUndefined()
    })

    it('should not collect nric or uen if form isSubmitterIdCollectionEnabled is false for CP authType', async () => {
      // Arrange
      MockOidcService.getOidcService.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwt: (_arg1) => ok('jwt'),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwtPayload: (_arg1) =>
          okAsync(merge(MOCK_JWT_CP_PAYLOAD, MOCK_COOKIE_TIMESTAMP)),
      } as OidcServiceType<FormAuthType.CP>)

      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndNricMaskingEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.CP,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
        isSubmitterIdCollectionEnabled: false,
      } as IPopulatedEncryptedForm

      const MOCK_REQ = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.CP,
            },
            encryptedFormDef: mockSpAuthTypeAndNricMaskingEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(MOCK_REQ, mockRes)

      // Assert
      // that verified content is not generated
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).not.toHaveBeenCalled()
      // that the saved submission is does not contain verified content
      const savedSubmission = await EncryptSubmission.findOne()

      expect(savedSubmission).toBeDefined()
      expect(savedSubmission).not.toBeNull()
      expect(savedSubmission!.verifiedContent).toBeUndefined()
    })

    it('should not include nric in email notification and not store nric if form isSubmitterIdCollectionEnabled is false for MyInfo authType', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockMyInfoAuthTypeAndSubmitterIdCollectionDisabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.MyInfo,
        isSubmitterIdCollectionEnabled: false,
        form_fields: [] as FormFieldSchema[],
        emails: ['test@example.com'],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const MOCK_REQ = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.MyInfo,
            },
            encryptedFormDef:
              mockMyInfoAuthTypeAndSubmitterIdCollectionDisabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(MOCK_REQ, mockRes)

      // not verified content is added
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).not.toHaveBeenCalled()
      // that the saved submission is does not contain verified content
      const savedSubmission = await EncryptSubmission.findOne()

      expect(savedSubmission).toBeDefined()
      expect(savedSubmission).not.toBeNull()
      expect(savedSubmission!.verifiedContent).toBeUndefined()

      // Assert
      // email notification should be sent
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(1)
      // Assert nric is not contained - formData empty array since no parsed responses to be included in email
      expect(
        MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData,
      ).toEqual([])
    })

    it('should include nric in email notification and store nric in verifiedContent if form isSubmitterIdCollectionEnabled is true for SgId authType', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSgidAuthTypeAndSubmitterIdCollectionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SGID,
        isSubmitterIdCollectionEnabled: true,
        form_fields: [] as FormFieldSchema[],
        emails: ['test@example.com'],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const MOCK_REQ = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SGID,
            },
            encryptedFormDef:
              mockSgidAuthTypeAndSubmitterIdCollectionEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      const expectedGetVerifiedContentArg = {
        uinFin: MOCK_NRIC,
        userInfo: undefined,
      }
      const expectedVerifiedContent = { sgidUinFin: MOCK_NRIC }

      // Act
      await submitEncryptModeFormForTest(MOCK_REQ, mockRes)

      // Assert

      // that verified content is generated since submitter login id is collected
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).toHaveBeenCalledWith({
        type: mockSgidAuthTypeAndSubmitterIdCollectionEnabledForm.authType,
        data: expectedGetVerifiedContentArg,
      })

      // that the saved submission is contains the correct verified content
      const savedSubmission = await EncryptSubmission.findOne()

      expect(savedSubmission).toBeDefined()
      expect(savedSubmission).not.toBeNull()
      expect(savedSubmission?.verifiedContent).toEqual(
        JSON.stringify(expectedVerifiedContent),
      )

      // email notification should be sent with nric included
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(1)
      expect(
        MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData[0]
          .answer,
      ).toEqual(MOCK_NRIC)
    })
  })

  describe('emailData', () => {
    it('should have the isVisible field set to true for form fields', async () => {
      // Arrange
      const performEncryptPostSubmissionActionsSpy = jest.spyOn(
        EncryptSubmissionService,
        'performEncryptPostSubmissionActions',
      )
      const mockFormId = new ObjectId()
      const mockEncryptForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.NIL,
        isSubmitterIdCollectionEnabled: false,
        form_fields: [
          {
            _id: new ObjectId(),
            fieldType: BasicField.ShortText,
            title: 'Long answer',
            description: '',
            required: false,
            disabled: false,
          },
        ] as FormFieldSchema[],
        emails: ['test@example.com'],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const mockResponses = [
        {
          _id: new ObjectId(),
          question: 'Long answer',
          answer: 'this is an answer',
          fieldType: 'textarea',
          isVisible: true,
        },
      ]

      const mockReq = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: mockResponses,
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {},
            encryptedFormDef: mockEncryptForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Setup the SubmissionEmailObj
      const emailData = new SubmissionEmailObj(
        mockResponses as any as ProcessedFieldResponse[],
        new Set(),
        FormAuthType.NIL,
      )

      // Act
      await submitEncryptModeFormForTest(mockReq, mockRes)

      // Assert
      expect(performEncryptPostSubmissionActionsSpy.mock.calls[0][2]).toEqual(
        emailData,
      )
    })
  })
})
