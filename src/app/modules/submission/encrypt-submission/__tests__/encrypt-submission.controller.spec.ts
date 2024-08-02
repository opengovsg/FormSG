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
        ok((verifiedContent as SpVerifiedContent).uinFin),
    ),
  }
})

const MockOidcService = jest.mocked(OidcService)
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

      expect(mockRes.status).toHaveBeenCalledOnceWith(403)

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
  })

  describe('nricMask', () => {
    const MOCK_NRIC = 'S1234567A'
    const MOCK_MASKED_NRIC = '*****567A'

    const MOCK_JWT_PAYLOAD = {
      userName: MOCK_NRIC,
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

    it('should mask nric if form isNricMaskEnabled is true', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndNricMaskingEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isNricMaskEnabled: true,
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
      // that verified content is generated using the masked nric
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).toHaveBeenCalledWith({
        type: mockSpAuthTypeAndNricMaskingEnabledForm.authType,
        data: { uinFin: MOCK_MASKED_NRIC, userInfo: undefined },
      })
      // that the saved submission is masked
      const savedSubmission = await EncryptSubmission.findOne()

      expect(savedSubmission).toBeDefined()
      expect(savedSubmission!.verifiedContent).toEqual(MOCK_MASKED_NRIC)
    })

    it('should not mask nric if form isNricMaskEnabled is false', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndNricMaskingEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isNricMaskEnabled: false,
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
      // that verified content is generated using the masked nric
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).toHaveBeenCalledWith({
        type: mockSpAuthTypeAndNricMaskingEnabledForm.authType,
        data: { uinFin: MOCK_NRIC, userInfo: undefined },
      })
      // that the saved submission is masked
      const savedSubmission = await EncryptSubmission.findOne()

      expect(savedSubmission).toBeDefined()
      expect(savedSubmission!.verifiedContent).toEqual(MOCK_NRIC)
    })

    it('should not mask nric in email notification if form isNricMaskEnabled is false', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndNricMaskingDisabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isNricMaskEnabled: false,
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
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndNricMaskingDisabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(MOCK_REQ, mockRes)

      // Assert
      // email notification should be sent with the unmasked nric
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(1)
      // Assert nric is not masked
      expect(
        MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData[0]
          .answer,
      ).toEqual(MOCK_NRIC)
    })

    it('should mask nric in email notification if form isNricMaskEnabled is true', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndNricMaskingEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isNricMaskEnabled: true,
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
      // email notification should be sent with the masked nric
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(1)
      // Assert nric is masked
      expect(
        MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData[0]
          .answer,
      ).toEqual(MOCK_MASKED_NRIC)
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
        isNricMaskEnabled: false,
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
