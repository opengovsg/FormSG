import {
  adaptV3ToV4,
  adaptV4ToV3,
  isFieldResponsesV4,
} from '@opengovsg/formsg-sdk/adapters'
import { ObjectId } from 'bson'
import type { Response } from 'express'
import { featureFlags } from 'formsg-shared/constants'
import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  MyInfoAttribute,
  MyInfoChildAttributes,
} from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'
import { errAsync, ok, okAsync } from 'neverthrow'
import nacl from 'tweetnacl'
import { decodeBase64, encodeBase64, encodeUTF8 } from 'tweetnacl-util'

import formsgSdk from 'src/app/config/formsg-sdk'
import {
  MyInfoHashDidNotMatchError,
  MyInfoMissingHashError,
} from 'src/app/modules/myinfo/myinfo.errors'
import { MyInfoService } from 'src/app/modules/myinfo/myinfo.service'
import * as MyInfoUtil from 'src/app/modules/myinfo/myinfo.util'
import * as OidcService from 'src/app/modules/spcp/spcp.oidc.service'
import * as SpcpUtil from 'src/app/modules/spcp/spcp.util'
import * as VerifiedContentService from 'src/app/modules/verified-content/verified-content.service'
import * as LogicAdaptor from 'src/app/utils/logic-adaptor'

import * as FeatureFlagService from '../../../feature-flags/feature-flags.service'
import { FormWhitelistSettingNotFoundError } from '../../../form/form.errors'
import * as FormService from '../../../form/form.service'
import { SubmissionNotFoundError } from '../../submission.errors'
import { generateHashedSubmitterId } from '../../submission.utils'
import {
  createFormsgAndRetrieveForm,
  encryptSubmission,
  handleNdiResponses,
  validateMultirespondentRemindBody,
  validateMultirespondentSubmission,
  validatePaymentSubmission,
  verifyMrfStepAuth,
  verifyMyInfoHashes,
} from '../multirespondent-submission.middleware'
import {
  checkFormIsMultirespondent,
  getMultirespondentSubmission,
} from '../multirespondent-submission.service'
import * as MrfUtils from '../multirespondent-submission.utils'
import { getMrfStepAuthCookieName, setMrfStepAuthCookie } from '../step-auth'
import * as stepToken from '../step-token'

jest.mock('../../../feature-flags/feature-flags.service')
jest.mock('../../../form/form.service')
jest.mock('../multirespondent-submission.service')
// RATIONALE: The factory mocks are required to prevent Jest from
// hanging when automock is enabled, due to retries against localhost.
jest.mock('../../../spcp/spcp.oidc.service', () => ({
  __esModule: true,
  getOidcService: jest.fn(),
}))
jest.mock('../../../myinfo/myinfo.service', () => ({
  __esModule: true,
  MyInfoService: {
    verifyLoginJwt: jest.fn(),
    fetchMyInfoHashes: jest.fn(),
    checkMyInfoHashes: jest.fn(),
  },
}))
jest.mock('../../../verified-content/verified-content.service')
jest.mock('src/app/modules/myinfo/myinfo.util')
jest.mock('src/app/modules/spcp/spcp.util')
jest.mock('@opengovsg/formsg-sdk/adapters', () => ({
  __esModule: true,
  adaptV3ToV4: jest.fn(),
  adaptV4ToV3: jest.fn(),
  isFieldResponsesV4: jest.fn(),
}))
jest.mock('src/app/utils/logic-adaptor')
jest.mock('../multirespondent-submission.utils', () => {
  const actual = jest.requireActual(
    '../multirespondent-submission.utils',
  ) as typeof import('../multirespondent-submission.utils')
  return {
    ...actual,
    validateMrfFieldResponses: jest.fn(),
  }
})
jest.mock('src/app/config/formsg-sdk', () => ({
  __esModule: true,
  default: {
    cryptoV3: {
      decryptFromSubmissionKey: jest.fn(),
      encrypt: jest.fn(),
    },
  },
}))

describe('Multirespondent Submission Middleware', () => {
  describe('validateMultirespondentRemindBody', () => {
    const runValidator = (body: Record<string, unknown>): Promise<unknown> =>
      new Promise((resolve) =>
        validateMultirespondentRemindBody(
          { body, method: 'POST', headers: {}, query: {}, params: {} } as any,
          {} as any,
          resolve as any,
        ),
      )

    it('accepts a reminder body carrying both the secret key and the step token', async () => {
      const error = await runValidator({
        submissionSecretKey: 'k',
        stepToken: 't',
      })
      expect(error).toBeFalsy()
    })
  })

  // Helper function to create fresh mockReq objects for each test
  const createMockReq = (params: { formId: string; submissionId?: string }) =>
    ({
      params,
      body: {
        respondentEmails: ['test@example.com'],
      },
      formsg: undefined,
      growthbook: {
        isOn: jest.fn().mockReturnValue(false),
        setAttributes: jest.fn().mockResolvedValue(undefined),
        getAttributes: jest.fn().mockReturnValue({
          unclobberedAttributeKey: 'unclobberedValue',
        }),
      },
      // Add Express request methods and properties
      get: jest.fn((name: string) => {
        if (name === 'cf-connecting-ip') return '127.0.0.1'
        if (name === 'cf-ray') return 'mock-cf-ray'
        return undefined
      }),
      ip: '127.0.0.1',
      id: 'mock-request-id',
      headers: {
        'cf-connecting-ip': '127.0.0.1',
        'cf-ray': 'mock-cf-ray',
        'x-request-id': 'mock-request-id',
      },
      baseUrl: '/api/v3',
      path: '/forms/mock-form-id/submissions',
      originalUrl: '/api/v3/forms/mock-form-id/submissions?param=value',
    }) as any

  // Helper function to create fresh mockRes objects for each test
  const createMockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  })
  // Mock responses only implement what the middlewares call.
  const toMiddlewareRes = (res: object) => res as unknown as Response

  describe('createFormsgAndRetrieveForm', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_SUBMISSION_ID = new ObjectId().toHexString()
    const MOCK_FEATURE_FLAGS = ['flag1', 'flag2']

    const MOCK_FORM = {
      _id: MOCK_FORM_ID,
      responseMode: FormResponseMode.Multirespondent,
      title: 'mock form title',
      publicKey: 'mockPublicKey',
      form_fields: [
        { _id: 'field1', fieldType: 'textfield', title: 'Field 1' },
        { _id: 'field2', fieldType: 'email', title: 'Field 2' },
      ],
      form_logics: [{ _id: 'logic1', logicType: 'showFields' }],
      workflow: [{ step: 1, edit: ['field1', 'field2'] }],
      hasRespondentCopy: true,
      emails: ['test@example.com'],
      stepOneEmailNotificationFieldId: 'field1',
      stepsToNotify: [new ObjectId().toHexString()],
      toObject: jest.fn().mockReturnValue({
        _id: MOCK_FORM_ID,
        responseMode: FormResponseMode.Multirespondent,
        title: 'mock form title',
        publicKey: 'mockPublicKey',
        form_fields: [
          { _id: 'field1', fieldType: 'textfield', title: 'Field 1' },
          { _id: 'field2', fieldType: 'email', title: 'Field 2' },
        ],
        form_logics: [{ _id: 'logic1', logicType: 'showFields' }],
        workflow: [{ step: 1, edit: ['field1', 'field2'] }],
        hasRespondentCopy: true,
        emails: ['test@example.com'],
        stepOneEmailNotificationFieldId: 'field1',
        stepsToNotify: [new ObjectId().toHexString()],
      }),
      // Add other required properties to satisfy IPopulatedForm interface
      admin: {
        _id: new ObjectId(),
        email: 'admin@example.com',
        agency: {
          fullName: 'Government Technology Agency',
        },
      },
      permissionList: [],
      startPage: { title: 'Start', paragraph: 'Start page' },
      endPage: { title: 'End', paragraph: 'End page' },
      hasCaptcha: false,
      hasIssueNotification: false,
      authType: FormResponseMode.Multirespondent,
      isSubmitterIdCollectionEnabled: false,
      isSingleSubmission: false,
      status: 'ACTIVE',
      inactiveMessage: '',
      submissionLimit: null,
      isListed: true,
      webhook: { url: '', isRetryEnabled: false },
      getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
    } as any

    const MOCK_MRF_SUBMISSION = {
      form: MOCK_FORM_ID,
      form_fields: [
        {
          _id: 'snapshot_field1',
          fieldType: 'textfield',
          title: 'Snapshot Field 1',
        },
        {
          _id: 'snapshot_field2',
          fieldType: 'email',
          title: 'Snapshot Field 2',
        },
      ],
      form_logics: [{ _id: 'snapshot_logic1', logicType: 'hideFields' }],
      workflow: [
        { step: 1, edit: ['snapshot_field1'] },
        { step: 2, edit: ['snapshot_field2'] },
      ],
      encryptedContent: 'encrypted-content',
      version: 1,
      workflowStep: 0,
      // Add other required properties to satisfy IMultirespondentSubmissionSchema interface
      submissionType: 'Multirespondent',
      _id: new ObjectId(),
      created: new Date(),
      modified: new Date(),
      getWebhookView: jest.fn(),
      mrfVersion: 1,
      authType: FormResponseMode.Multirespondent,
    } as any

    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetAllMocks()
    })

    it('should set formsg.mrfSubmission and formsg.snapshottedFormDef when submissionId exists and mrfSubmission is found', async () => {
      // Arrange - Set up mocks for this specific test
      jest
        .mocked(FeatureFlagService.getEnabledFlags)
        .mockReturnValue(okAsync(MOCK_FEATURE_FLAGS))

      jest
        .mocked(FormService.retrieveFullFormById)
        .mockReturnValue(okAsync(MOCK_FORM))

      jest
        .mocked(getMultirespondentSubmission)
        .mockReturnValue(okAsync(MOCK_MRF_SUBMISSION))

      jest.mocked(checkFormIsMultirespondent).mockReturnValue(ok(MOCK_FORM))

      const mockNext = jest.fn()

      const mockReq = createMockReq({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
      })
      const mockRes = createMockRes()

      // Act
      await createFormsgAndRetrieveForm(mockReq, mockRes as any, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(mockReq).toHaveProperty('formsg')

      // Verify that mrfSubmission is set
      expect(mockReq.formsg.mrfSubmission).toEqual(MOCK_MRF_SUBMISSION)

      // Verify that formDef (latestFormDef) is set
      expect(mockReq.formsg.formDef).toEqual(MOCK_FORM)

      // Verify that snapshottedFormDef is set with correct structure
      expect(mockReq.formsg.snapshottedFormDef).toEqual({
        _id: MOCK_FORM_ID,
        title: MOCK_FORM.title,
        form_fields: MOCK_MRF_SUBMISSION.form_fields, // Should use snapshot from submission
        form_logics: MOCK_MRF_SUBMISSION.form_logics, // Should use snapshot from submission
        webhook: MOCK_FORM.webhook, // Should use current form data
        workflow: MOCK_MRF_SUBMISSION.workflow, // Should use snapshot from submission
        admin: MOCK_FORM.admin, // Should use current form data
        emails: MOCK_FORM.emails, // Should use current form data
        stepOneEmailNotificationFieldId:
          MOCK_FORM.stepOneEmailNotificationFieldId, // Should use current form data
        stepsToNotify: MOCK_FORM.stepsToNotify, // Should use current form data
      })

      // Verify that getMultirespondentSubmission was called with the correct submissionId
      expect(getMultirespondentSubmission).toHaveBeenCalledWith(
        MOCK_SUBMISSION_ID,
      )
      expect(mockReq.growthbook?.setAttributes).toHaveBeenCalledWith({
        ...mockReq.growthbook?.getAttributes(),
        formId: MOCK_FORM_ID,
        adminEmail: MOCK_FORM.admin.email,
      })
    })

    it('should return error response when submissionId exists but mrfSubmission is not found', async () => {
      // Arrange - Set up mocks for this specific test
      jest
        .mocked(FeatureFlagService.getEnabledFlags)
        .mockReturnValue(okAsync(MOCK_FEATURE_FLAGS))

      jest
        .mocked(FormService.retrieveFullFormById)
        .mockReturnValue(okAsync(MOCK_FORM))

      const mockError = new SubmissionNotFoundError()
      jest
        .mocked(getMultirespondentSubmission)
        .mockReturnValue(errAsync(mockError))

      jest.mocked(checkFormIsMultirespondent).mockReturnValue(ok(MOCK_FORM))

      const mockReq = createMockReq({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
      })
      const mockRes = createMockRes()

      const mockNext = jest.fn()
      // Act
      await createFormsgAndRetrieveForm(mockReq, mockRes as any, mockNext)

      // Assert
      expect(mockNext).not.toHaveBeenCalled() // Should NOT call next on error
      expect(mockRes.status).toHaveBeenCalledWith(404) // SubmissionNotFoundError maps to 404
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Submission not found for given ID',
      })
      expect(mockReq.formsg).toBeUndefined() // formsg should not be set on error
    })

    it('should not set snapshottedFormDef and mrfSubmission when submissionId does not exist', async () => {
      // Arrange - Set up mocks for this specific test
      jest
        .mocked(FeatureFlagService.getEnabledFlags)
        .mockReturnValue(okAsync(MOCK_FEATURE_FLAGS))

      jest
        .mocked(FormService.retrieveFullFormById)
        .mockReturnValue(okAsync(MOCK_FORM))

      jest.mocked(checkFormIsMultirespondent).mockReturnValue(ok(MOCK_FORM))

      const mockReq = createMockReq({
        formId: MOCK_FORM_ID,
        // No submissionId
      })
      const mockRes = createMockRes()

      const mockNext = jest.fn()

      // Act
      await createFormsgAndRetrieveForm(mockReq, mockRes as any, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(mockReq).toHaveProperty('formsg')

      // Verify that mrfSubmission is undefined (since retrieveMultirespondentSubmissionIfExists returns undefined)
      expect(mockReq.formsg.mrfSubmission).toBeUndefined()

      // Verify that formDef is still set
      expect(mockReq.formsg.formDef).toEqual(MOCK_FORM)

      // Verify that snapshottedFormDef is undefined
      expect(mockReq.formsg.snapshottedFormDef).toBeUndefined()

      // Verify that getMultirespondentSubmission was NOT called
      expect(getMultirespondentSubmission).not.toHaveBeenCalled()
    })
  })

  describe('handleNdiResponses', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_SUBMISSION_ID = new ObjectId().toHexString()

    const MOCK_FORM = {
      _id: MOCK_FORM_ID,
      responseMode: FormResponseMode.Multirespondent,
      title: 'mock form title',
      publicKey: 'mockPublicKey',
      form_fields: [
        { _id: 'field1', fieldType: 'textfield', title: 'Field 1' },
      ],
      form_logics: [],
      workflow: [
        { step: 1, edit: ['field1'] },
        { step: 2, edit: ['field1'] },
      ],
      hasRespondentCopy: false,
      emails: ['test@example.com'],
      stepOneEmailNotificationFieldId: 'field1',
      stepsToNotify: [new ObjectId().toHexString()],
      toObject: jest.fn().mockReturnValue({
        _id: MOCK_FORM_ID,
        responseMode: FormResponseMode.Multirespondent,
        title: 'mock form title',
        publicKey: 'mockPublicKey',
        form_fields: [
          { _id: 'field1', fieldType: 'textfield', title: 'Field 1' },
        ],
        form_logics: [],
        workflow: [
          { step: 1, edit: ['field1'] },
          { step: 2, edit: ['field1'] },
        ],
        hasRespondentCopy: false,
        emails: ['test@example.com'],
        stepOneEmailNotificationFieldId: 'field1',
        stepsToNotify: [new ObjectId().toHexString()],
      }),
      // Add other required properties to satisfy IPopulatedForm interface
      admin: { _id: new ObjectId() },
      permissionList: [],
      startPage: { title: 'Start', paragraph: 'Start page' },
      endPage: { title: 'End', paragraph: 'End page' },
      hasCaptcha: false,
      hasIssueNotification: false,
      authType: FormAuthType.MyInfo,
      isSubmitterIdCollectionEnabled: true,
      isSingleSubmission: false,
      status: 'ACTIVE',
      inactiveMessage: '',
      submissionLimit: null,
      isListed: true,
      webhook: { url: '', isRetryEnabled: false },
      getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
    } as any

    const MOCK_MRF_SUBMISSION = {
      form: MOCK_FORM_ID,
      form_fields: [
        {
          _id: 'snapshot_field1',
          fieldType: 'textfield',
          title: 'Snapshot Field 1',
        },
      ],
      form_logics: [],
      workflow: [
        { step: 1, edit: ['snapshot_field1'] },
        { step: 2, edit: ['snapshot_field1'] },
      ],
      encryptedContent: 'encrypted-content',
      verifiedContent: 'verified-content',
      version: 1,
      workflowStep: 0,
      submissionType: 'Multirespondent',
      _id: new ObjectId(),
      created: new Date(),
      modified: new Date(),
      getWebhookView: jest.fn(),
      mrfVersion: 1,
      authType: FormAuthType.MyInfo,
    } as any

    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetAllMocks()
      jest.mocked(MyInfoService.fetchMyInfoHashes).mockReturnValue(okAsync({}))
    })

    describe('submitterId is set', () => {
      it('should set submitterId and hashedSubmitterId in encryptedPayload if is step 1 submission with singpass auth type', async () => {
        jest
          .mocked(MyInfoUtil.extractMyInfoLoginJwt)
          .mockReturnValue(ok('mock-jwt-string'))

        jest.mocked(MyInfoService.verifyLoginJwt).mockReturnValue(
          ok({
            uinFin: 'S1234567A',
          }),
        )

        jest
          .mocked(VerifiedContentService.getVerifiedContent)
          .mockReturnValue(ok({ uinFin: 'S1234567A' }))

        jest
          .mocked(VerifiedContentService.encryptVerifiedContent)
          .mockReturnValue(ok('encrypted-verified-content'))

        const mockDecryptFromSubmissionKey = formsgSdk.cryptoV3
          .decryptFromSubmissionKey as jest.Mock

        mockDecryptFromSubmissionKey.mockReturnValue({
          verified: {},
          submissionSecretKey: '',
          responses: {},
        })

        jest.mocked(SpcpUtil.createNdiResponsesV3FromRecord).mockReturnValue({
          'SingPass Validated NRIC': {
            fieldType: BasicField.Nric,
            answer: 'S9812379B',
          },
        })

        const mockNext = jest.fn()

        const mockReq = createMockReq({
          formId: MOCK_FORM_ID,
          submissionId: MOCK_SUBMISSION_ID,
        })
        mockReq.formsg = {
          formDef: MOCK_FORM,
          mrfSubmission: MOCK_MRF_SUBMISSION,
          encryptedPayload: {
            submissionPublicKey: 'mockSubmissionPublicKey',
          },
        }

        const mockRes = createMockRes()

        await handleNdiResponses(mockReq, mockRes as any, mockNext)

        expect(mockNext).toHaveBeenCalled()
        expect(mockReq.formsg.encryptedPayload.hashedSubmitterId).toEqual(
          generateHashedSubmitterId('S1234567A', MOCK_FORM_ID),
        )
        expect(mockReq.formsg.encryptedPayload.submitterId).toEqual('S1234567A')
      })

      it('should set submitterId and hashedSubmitterId in encryptedPayload if is step 1 submission with corppass auth type', async () => {
        jest.mocked(OidcService.getOidcService).mockReturnValue({
          extractJwt: jest.fn().mockReturnValue({
            asyncAndThen: jest.fn().mockReturnValue(
              okAsync({
                userName: 'S1234567A',
                userInfo: { email: 'test@example.com', name: 'Test' },
              }),
            ),
          }),
          extractJwtPayload: jest.fn().mockReturnValue(
            okAsync({
              userName: 'S1234567A',
              userInfo: { email: 'test@example.com', name: 'Test' },
            }),
          ),
        } as unknown as ReturnType<typeof OidcService.getOidcService>)

        jest
          .mocked(VerifiedContentService.getVerifiedContent)
          .mockReturnValue(ok({ uinFin: 'S1234567A' }))

        jest
          .mocked(VerifiedContentService.encryptVerifiedContent)
          .mockReturnValue(ok('encrypted-verified-content'))

        const mockDecryptFromSubmissionKey = formsgSdk.cryptoV3
          .decryptFromSubmissionKey as jest.Mock

        mockDecryptFromSubmissionKey.mockReturnValue({
          verified: {},
          submissionSecretKey: '',
          responses: {},
        })

        jest.mocked(SpcpUtil.createNdiResponsesV3FromRecord).mockReturnValue({
          'SingPass Validated NRIC': {
            fieldType: BasicField.Nric,
            answer: 'S9812379B',
          },
        })

        const mockNext = jest.fn()

        const mockReq = createMockReq({
          formId: MOCK_FORM_ID,
          submissionId: MOCK_SUBMISSION_ID,
        })
        mockReq.formsg = {
          formDef: {
            ...MOCK_FORM,
            authType: FormAuthType.CP,
          },
          mrfSubmission: MOCK_MRF_SUBMISSION,
          encryptedPayload: {
            submissionPublicKey: 'mockSubmissionPublicKey',
          },
        }

        const mockRes = createMockRes()

        await handleNdiResponses(mockReq, mockRes as any, mockNext)

        expect(mockNext).toHaveBeenCalled()
        expect(mockReq.formsg.encryptedPayload.hashedSubmitterId).toEqual(
          generateHashedSubmitterId('S1234567A', MOCK_FORM_ID),
        )
        expect(mockReq.formsg.encryptedPayload.submitterId).toEqual('S1234567A')
      })

      it('should not set submitterId or hashedSubmitterId in encryptedPayload if is step 1 submission with non-singpass auth type', async () => {
        const mockNext = jest.fn()

        const mockReq = createMockReq({
          formId: MOCK_FORM_ID,
          submissionId: MOCK_SUBMISSION_ID,
        })
        mockReq.formsg = {
          formDef: {
            ...MOCK_FORM,
            authType: FormAuthType.NIL,
          },
          mrfSubmission: MOCK_MRF_SUBMISSION,
          encryptedPayload: {
            submissionPublicKey: 'mockSubmissionPublicKey',
          },
        }

        const mockRes = createMockRes()

        await handleNdiResponses(mockReq, mockRes as any, mockNext)

        expect(mockNext).toHaveBeenCalled()
        expect(mockReq.formsg.encryptedPayload).not.toHaveProperty(
          'hashedSubmitterId',
        )
        expect(mockReq.formsg.encryptedPayload).not.toHaveProperty(
          'submitterId',
        )
      })

      it('should not set submitterId or hashedSubmitterId in encryptedPayload if is step >=2 submission', async () => {
        const mockNext = jest.fn()

        const mockReq = createMockReq({
          formId: MOCK_FORM_ID,
          submissionId: MOCK_SUBMISSION_ID,
        })
        mockReq.body.workflowStep = 1

        mockReq.formsg = {
          formDef: MOCK_FORM,
          mrfSubmission: {
            ...MOCK_MRF_SUBMISSION,
            workflowStep: 1,
          },
          encryptedPayload: {
            submissionPublicKey: 'mockSubmissionPublicKey',
          },
        }

        const mockRes = createMockRes()

        await handleNdiResponses(mockReq, mockRes as any, mockNext)

        expect(mockNext).toHaveBeenCalled()
        expect(mockReq.formsg.encryptedPayload).not.toHaveProperty(
          'hashedSubmitterId',
        )
        expect(mockReq.formsg.encryptedPayload).not.toHaveProperty(
          'submitterId',
        )
      })

      it('should return 500 internal server error if submitterId is not found for singpass auth type and is step 1 submission', async () => {
        jest
          .mocked(MyInfoUtil.extractMyInfoLoginJwt)
          .mockReturnValue(ok('mock-jwt-string'))

        jest.mocked(MyInfoService.verifyLoginJwt).mockReturnValue(
          ok({
            uinFin: '',
          }),
        )

        jest
          .mocked(VerifiedContentService.getVerifiedContent)
          .mockReturnValue(ok({}))

        const mockNext = jest.fn()

        const mockReq = createMockReq({
          formId: MOCK_FORM_ID,
          submissionId: MOCK_SUBMISSION_ID,
        })
        mockReq.formsg = {
          formDef: MOCK_FORM,
          mrfSubmission: MOCK_MRF_SUBMISSION,
          encryptedPayload: {
            submissionPublicKey: 'mockSubmissionPublicKey',
          },
        }

        const mockRes = createMockRes()

        await handleNdiResponses(mockReq, mockRes as any, mockNext)

        expect(mockNext).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Failed to retrieve submitter ID. Please try again.',
          messageKey:
            'features.publicForm.backendErrors.submission.mrf.missingSubmitterId',
        })
      })
    })

    it('should handle NDI responses for the first step correctly', async () => {
      // Arrange
      jest.mocked(OidcService.getOidcService).mockReturnValue({
        extractJwt: jest.fn().mockReturnValue({
          asyncAndThen: jest.fn().mockReturnValue(
            okAsync({
              userName: 'S1234567A',
              userInfo: { email: 'test@example.com', name: 'Test' },
            }),
          ),
        }),
        extractJwtPayload: jest.fn().mockReturnValue(
          okAsync({
            userName: 'S1234567A',
            userInfo: { email: 'test@example.com', name: 'Test' },
          }),
        ),
      } as unknown as ReturnType<typeof OidcService.getOidcService>)

      jest
        .mocked(MyInfoUtil.extractMyInfoLoginJwt)
        .mockReturnValue(ok('mock-jwt-string'))

      jest.mocked(MyInfoService.verifyLoginJwt).mockReturnValue(
        ok({
          uinFin: 'S1234567A',
        }),
      )

      jest
        .mocked(VerifiedContentService.getVerifiedContent)
        .mockReturnValue(ok({ uinFin: 'S1234567A' }))

      jest
        .mocked(VerifiedContentService.encryptVerifiedContent)
        .mockReturnValue(ok('encrypted-verified-content'))

      const mockDecryptFromSubmissionKey = formsgSdk.cryptoV3
        .decryptFromSubmissionKey as jest.Mock

      mockDecryptFromSubmissionKey.mockReturnValue({
        verified: {},
        submissionSecretKey: '',
        responses: {},
      })

      jest.mocked(SpcpUtil.createNdiResponsesV4FromRecord).mockReturnValue({
        'SingPass Validated NRIC': {
          fieldType: BasicField.Nric,
          answer: { value: 'S9812379B' },
          question: 'SingPass Validated NRIC',
          provenance: {},
        },
      } as any)

      const mockNext = jest.fn()

      const mockReq = createMockReq({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
      })
      mockReq.formsg = {
        formDef: MOCK_FORM,
        mrfSubmission: MOCK_MRF_SUBMISSION,
        encryptedPayload: {
          submissionPublicKey: 'mockSubmissionPublicKey',
        },
      }

      const mockRes = createMockRes()

      // Act
      await handleNdiResponses(mockReq, mockRes as any, mockNext)

      // Assert
      expect(
        jest.mocked(SpcpUtil.createNdiResponsesV4FromRecord),
      ).toHaveBeenCalled()
      expect(mockReq.formsg.encryptedPayload.responses).toHaveProperty(
        'SingPass Validated NRIC',
      )
      expect(
        jest.mocked(VerifiedContentService.getVerifiedContent),
      ).toHaveBeenCalled()
      expect(
        jest.mocked(formsgSdk.cryptoV3.decryptFromSubmissionKey),
      ).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()

      expect(
        jest.mocked(VerifiedContentService.encryptVerifiedContent),
      ).toHaveBeenCalledWith({
        verifiedContent: { uinFin: 'S1234567A' },
        formPublicKey: 'mockSubmissionPublicKey',
      })
      expect(mockReq.formsg.encryptedPayload.verifiedContent).toEqual(
        'encrypted-verified-content',
      )
    })

    it('should handle NDI responses for a step 2 submission by using previous submission verifiedContent', async () => {
      // Arrange
      jest
        .mocked(MyInfoUtil.extractMyInfoLoginJwt)
        .mockReturnValue(ok('mock-jwt-string'))

      jest.mocked(MyInfoService.verifyLoginJwt).mockReturnValue(
        ok({
          uinFin: 'S1234567A',
        }),
      )

      const mockDecryptFromSubmissionKey = formsgSdk.cryptoV3
        .decryptFromSubmissionKey as jest.Mock

      mockDecryptFromSubmissionKey.mockReturnValue({
        // decrypted previous submission payload
        verified: { uinFin: 'S1234567A' },
        submissionSecretKey: 'prev-submission-secret',
        responses: {
          // previous submission had these responses
          '60f6c2b8a2e6f2a9b0d6c8e1': {
            fieldType: BasicField.Nric,
            answer: 'S1234567A',
          },
        },
      })

      jest.mocked(SpcpUtil.createNdiResponsesV4FromRecord).mockReturnValue({
        'SingPass Validated NRIC': {
          fieldType: BasicField.Nric,
          answer: { value: 'S1234567A' },
          question: 'SingPass Validated NRIC',
          provenance: {},
        },
      } as any)

      jest
        .mocked(VerifiedContentService.getVerifiedContent)
        .mockReturnValueOnce(ok({ uinFin: 'S1234567A' }))

      jest
        .mocked(VerifiedContentService.encryptVerifiedContent)
        .mockReturnValueOnce(ok('encrypted-verified-content'))

      const mockNext = jest.fn()

      const mockReq = createMockReq({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
      })
      const mockRes = createMockRes()

      // for step 2+ mrf submissions prevSubmissionSecretKeys are supplied
      mockReq.body.submissionSecretKey = 'prev-submission-secret'

      const MOCK_MRF_SUBMISSION_UPDATED = {
        ...MOCK_MRF_SUBMISSION,
        workflowStep: 1,
        verifiedContent: 'verified-content',
      }

      mockReq.formsg = {
        formDef: MOCK_FORM,
        mrfSubmission: MOCK_MRF_SUBMISSION_UPDATED,
        encryptedPayload: {
          submissionPublicKey: 'mockSubmissionPublicKey',
        },
      }

      // Act
      await handleNdiResponses(mockReq, mockRes as any, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()

      // Previous submission must be decrypted to obtain verified content
      expect(mockDecryptFromSubmissionKey).toHaveBeenCalled()

      // Verified content must be derived from the decrypted previous submission
      expect(
        jest.mocked(VerifiedContentService.getVerifiedContent),
      ).toHaveBeenCalled()
      expect(
        jest.mocked(VerifiedContentService.encryptVerifiedContent),
      ).toHaveBeenCalledWith({
        verifiedContent: { uinFin: 'S1234567A' },
        formPublicKey: 'mockSubmissionPublicKey',
      })
      expect(mockReq.formsg.encryptedPayload.verifiedContent).toEqual(
        'encrypted-verified-content',
      )
      expect(mockReq.formsg.encryptedPayload.responses).toHaveProperty(
        'SingPass Validated NRIC',
      )
    })

    describe('later step with login', () => {
      const { getVerifiedContent: actualGetVerifiedContent } =
        jest.requireActual<typeof VerifiedContentService>(
          'src/app/modules/verified-content/verified-content.service',
        )
      const STEP_1_VERIFIED = { 'uinFin (Step 1)': 'S1234567A' }

      const createStep2Req = ({
        authType,
        isSubmitterIdCollectionEnabled = true,
        session,
      }: {
        authType: FormAuthType.MyInfo | FormAuthType.CP
        isSubmitterIdCollectionEnabled?: boolean
        session?: Record<string, string>
      }) => {
        const mockReq = createMockReq({
          formId: MOCK_FORM_ID,
          submissionId: MOCK_SUBMISSION_ID,
        })
        mockReq.body.workflowStep = 1
        mockReq.body.submissionSecretKey = 'prev-submission-secret'
        mockReq.formsg = {
          // The live form collects nothing; later steps use their own copy.
          formDef: { ...MOCK_FORM, isSubmitterIdCollectionEnabled: false },
          mrfSubmission: {
            ...MOCK_MRF_SUBMISSION,
            verifiedContent: 'verified-content',
          },
          stepAuth: {
            workflowStep: 1,
            stepFields: [],
            login: {
              authType,
              isSubmitterIdCollectionEnabled,
              whitelist: { isWhitelistEnabled: false },
            },
            session,
          },
          encryptedPayload: { submissionPublicKey: 'mockSubmissionPublicKey' },
        }
        return mockReq
      }

      beforeEach(() => {
        jest
          .mocked(VerifiedContentService.getVerifiedContent)
          .mockImplementation(actualGetVerifiedContent)
        jest
          .mocked(VerifiedContentService.encryptVerifiedContent)
          .mockReturnValue(ok('encrypted-verified-content'))
        ;(
          formsgSdk.cryptoV3.decryptFromSubmissionKey as jest.Mock
        ).mockReturnValue({ verified: STEP_1_VERIFIED, responses: {} })
      })

      it("should add this step's Singpass identity beside Step 1's", async () => {
        const mockNext = jest.fn()
        const mockReq = createStep2Req({
          authType: FormAuthType.MyInfo,
          session: { userName: 'S7654321B', myInfoAuthSessionId: 'fapi' },
        })

        await handleNdiResponses(
          mockReq,
          toMiddlewareRes(createMockRes()),
          mockNext,
        )

        expect(mockNext).toHaveBeenCalled()
        // Never Step 1's global login cookie
        expect(MyInfoUtil.extractMyInfoLoginJwt).not.toHaveBeenCalled()
        expect(
          VerifiedContentService.encryptVerifiedContent,
        ).toHaveBeenCalledWith({
          verifiedContent: {
            'uinFin (Step 1)': 'S1234567A',
            'uinFin (Step 2)': 'S7654321B',
          },
          formPublicKey: 'mockSubmissionPublicKey',
        })
        // Only Step 1 records the submitter (one response per identity)
        expect(mockReq.formsg.encryptedPayload).not.toHaveProperty(
          'submitterId',
        )
        expect(mockReq.formsg.encryptedPayload).not.toHaveProperty(
          'hashedSubmitterId',
        )
      })

      it("should add this step's Corppass entity and user", async () => {
        const mockNext = jest.fn()
        const mockReq = createStep2Req({
          authType: FormAuthType.CP,
          session: { userName: '200000177W', userInfo: 'CP-UID' },
        })

        await handleNdiResponses(
          mockReq,
          toMiddlewareRes(createMockRes()),
          mockNext,
        )

        expect(mockNext).toHaveBeenCalled()
        expect(
          VerifiedContentService.encryptVerifiedContent,
        ).toHaveBeenCalledWith({
          verifiedContent: {
            'uinFin (Step 1)': 'S1234567A',
            'cpUen (Step 2)': '200000177W',
            'cpUid (Step 2)': 'CP-UID',
          },
          formPublicKey: 'mockSubmissionPublicKey',
        })
      })

      it("should keep earlier identities when this step doesn't collect its own", async () => {
        const mockNext = jest.fn()
        const mockReq = createStep2Req({
          authType: FormAuthType.MyInfo,
          isSubmitterIdCollectionEnabled: false,
          session: { userName: 'S7654321B', myInfoAuthSessionId: 'fapi' },
        })

        await handleNdiResponses(
          mockReq,
          toMiddlewareRes(createMockRes()),
          mockNext,
        )

        expect(mockNext).toHaveBeenCalled()
        expect(
          VerifiedContentService.encryptVerifiedContent,
        ).toHaveBeenCalledWith({
          verifiedContent: STEP_1_VERIFIED,
          formPublicKey: 'mockSubmissionPublicKey',
        })
      })

      it('should reject a login step without its verified login', async () => {
        const mockNext = jest.fn()
        const mockRes = createMockRes()

        await handleNdiResponses(
          createStep2Req({ authType: FormAuthType.MyInfo }),
          toMiddlewareRes(mockRes),
          mockNext,
        )

        expect(mockNext).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED)
        expect(
          VerifiedContentService.encryptVerifiedContent,
        ).not.toHaveBeenCalled()
      })
    })
  })

  describe('verifyMyInfoHashes', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_MYINFO_FIELD_ID = new ObjectId().toHexString()

    const MOCK_MYINFO_FORM_DEF = {
      _id: MOCK_FORM_ID,
      authType: FormAuthType.MyInfo,
      form_fields: [
        {
          _id: MOCK_MYINFO_FIELD_ID,
          fieldType: BasicField.ShortText,
          title: 'Name',
          myInfo: { attr: 'name' },
        },
      ],
    }

    const MOCK_MYINFO_RESPONSES = {
      [MOCK_MYINFO_FIELD_ID]: {
        fieldType: BasicField.ShortText,
        answer: { value: 'John Tan' },
        question: 'Name',
        provenance: {},
      },
    }

    const setupMyInfoLoginMocks = () => {
      jest
        .mocked(MyInfoUtil.extractMyInfoLoginJwt)
        .mockReturnValue(ok('mock-jwt-string'))
      jest
        .mocked(MyInfoService.verifyLoginJwt)
        .mockReturnValue(ok({ uinFin: 'S1234567A' }))
    }

    // A first-step (new) submission on a MyInfo-authed form.
    const createMyInfoMockReq = () => {
      const mockReq = createMockReq({ formId: MOCK_FORM_ID })
      mockReq.body.responses = MOCK_MYINFO_RESPONSES
      mockReq.formsg = {
        formDef: MOCK_MYINFO_FORM_DEF,
        mrfSubmission: undefined,
      }
      return mockReq
    }

    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetAllMocks()
    })

    it('should retain verified field IDs when MyInfo hashes match', async () => {
      // Arrange
      setupMyInfoLoginMocks()
      jest
        .mocked(MyInfoService.fetchMyInfoHashes)
        .mockReturnValue(okAsync({ name: 'mock-hash' }))
      jest
        .mocked(MyInfoService.checkMyInfoHashes)
        .mockReturnValue(okAsync(new Set([MOCK_MYINFO_FIELD_ID])))

      const mockNext = jest.fn()
      const mockReq = createMyInfoMockReq()
      const mockRes = createMockRes()

      // Act
      await verifyMyInfoHashes(mockReq, mockRes as any, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(jest.mocked(MyInfoService.fetchMyInfoHashes)).toHaveBeenCalledWith(
        'S1234567A',
        MOCK_FORM_ID,
      )
      expect(mockReq.formsg.myInfoReadOnlyFields).toEqual([
        MOCK_MYINFO_FIELD_ID,
      ])
      // The responses passed to the hash check must be adapted from the V4
      // shape, with the myInfo attribute sourced from the form definition.
      expect(jest.mocked(MyInfoService.checkMyInfoHashes)).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            _id: MOCK_MYINFO_FIELD_ID,
            fieldType: BasicField.ShortText,
            answer: 'John Tan',
            myInfo: { attr: 'name' },
            isVisible: true,
          }),
        ],
        { name: 'mock-hash' },
      )
    })

    it('should stamp provenance.myinfoVerified on responses whose child hash keys were verified', async () => {
      // Arrange
      setupMyInfoLoginMocks()
      const childrenFieldId = new ObjectId().toHexString()
      const childrenField = {
        _id: childrenFieldId,
        title: 'Children',
        fieldType: BasicField.Children,
        childrenSubFields: [MyInfoChildAttributes.ChildName],
        myInfo: { attr: MyInfoAttribute.ChildrenBirthRecords },
      }
      const childrenResponse = {
        fieldType: BasicField.Children,
        question: 'Children',
        provenance: {},
        answer: {
          child0: {
            value: {
              [MyInfoChildAttributes.ChildName]: { value: 'PHUA CHU KING' },
            },
          },
        },
      }
      jest.mocked(MyInfoService.fetchMyInfoHashes).mockReturnValue(okAsync({}))
      jest
        .mocked(MyInfoService.checkMyInfoHashes)
        .mockReturnValue(
          okAsync(
            new Set([
              `${MyInfoAttribute.ChildrenBirthRecords}.${childrenFieldId}.${MyInfoChildAttributes.ChildName}.0.PHUA CHU KING`,
            ]) as any,
          ),
        )

      const mockNext = jest.fn()
      const mockReq = createMyInfoMockReq()
      mockReq.formsg.formDef = {
        ...MOCK_MYINFO_FORM_DEF,
        form_fields: [childrenField],
      }
      mockReq.body.responses = { [childrenFieldId]: childrenResponse }
      const mockRes = createMockRes()

      // Act
      await verifyMyInfoHashes(mockReq, mockRes as any, mockNext)

      // Assert: the verification outcome is recorded on the responses inside
      // this middleware, i.e. before encryptSubmission snapshots them into
      // the stored encryptedContent.
      expect(mockNext).toHaveBeenCalled()
      expect(childrenResponse.provenance).toEqual({ myinfoVerified: true })
    })

    it('should reject the submission with 401 when a MyInfo answer does not match its hash', async () => {
      // Arrange
      setupMyInfoLoginMocks()
      jest
        .mocked(MyInfoService.fetchMyInfoHashes)
        .mockReturnValue(okAsync({ name: 'mock-hash' }))
      jest
        .mocked(MyInfoService.checkMyInfoHashes)
        .mockReturnValue(errAsync(new MyInfoHashDidNotMatchError()))

      const mockNext = jest.fn()
      const mockReq = createMyInfoMockReq()
      const mockRes = createMockRes()

      // Act
      await verifyMyInfoHashes(mockReq, mockRes as any, mockNext)

      // Assert
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'MyInfo verification failed.',
          spcpSubmissionFailure: true,
        }),
      )
    })

    it('should reject the submission with 410 when MyInfo hashes are missing or expired', async () => {
      // Arrange
      setupMyInfoLoginMocks()
      jest
        .mocked(MyInfoService.fetchMyInfoHashes)
        .mockReturnValue(errAsync(new MyInfoMissingHashError()))

      const mockNext = jest.fn()
      const mockReq = createMyInfoMockReq()
      const mockRes = createMockRes()

      // Act
      await verifyMyInfoHashes(mockReq, mockRes as any, mockNext)

      // Assert
      expect(mockNext).not.toHaveBeenCalled()
      expect(
        jest.mocked(MyInfoService.checkMyInfoHashes),
      ).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.GONE)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'MyInfo verification expired, please refresh and try again.',
          spcpSubmissionFailure: true,
        }),
      )
    })

    it('should skip the hash check for non-MyInfo forms', async () => {
      // Arrange
      const mockNext = jest.fn()
      const mockReq = createMyInfoMockReq()
      mockReq.formsg.formDef = {
        ...MOCK_MYINFO_FORM_DEF,
        authType: FormAuthType.NIL,
      }
      const mockRes = createMockRes()

      // Act
      await verifyMyInfoHashes(mockReq, mockRes as any, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(
        jest.mocked(MyInfoService.fetchMyInfoHashes),
      ).not.toHaveBeenCalled()
      expect(
        jest.mocked(MyInfoService.checkMyInfoHashes),
      ).not.toHaveBeenCalled()
    })

    it('should skip the hash check for a later step without MyInfo login', async () => {
      // Arrange: the live form is MyInfo, but the pending step has no login.
      const mockNext = jest.fn()
      const mockReq = createMyInfoMockReq()
      mockReq.formsg.mrfSubmission = { workflowStep: 0 }
      mockReq.formsg.stepAuth = { workflowStep: 1, stepFields: [] }
      const mockRes = createMockRes()

      // Act
      await verifyMyInfoHashes(mockReq, toMiddlewareRes(mockRes), mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(
        jest.mocked(MyInfoService.fetchMyInfoHashes),
      ).not.toHaveBeenCalled()
      expect(
        jest.mocked(MyInfoService.checkMyInfoHashes),
      ).not.toHaveBeenCalled()
    })

    it('should fail closed for a later step whose login was not resolved', async () => {
      const mockNext = jest.fn()
      const mockReq = createMyInfoMockReq()
      mockReq.formsg.mrfSubmission = { workflowStep: 0 }
      const mockRes = createMockRes()

      await verifyMyInfoHashes(mockReq, toMiddlewareRes(mockRes), mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })

    describe('later MyInfo step', () => {
      const STEP_1_NAME_ID = new ObjectId().toHexString()
      const STEP_2_NAME_ID = new ObjectId().toHexString()
      const nameField = (_id: string) => ({
        _id,
        fieldType: BasicField.ShortText,
        title: 'Name',
        myInfo: { attr: 'name' },
      })
      const SESSION = {
        userName: 'S7654321B',
        myInfoAuthSessionId: 'step-2-fapi-session',
      }

      const createStep2Req = () => {
        const mockReq = createMockReq({
          formId: MOCK_FORM_ID,
          submissionId: new ObjectId().toHexString(),
        })
        mockReq.body.responses = {
          // Step 1's answer, carried forward and verified back then
          [STEP_1_NAME_ID]: {
            fieldType: BasicField.ShortText,
            answer: { value: 'First Person' },
            question: 'Name',
            provenance: { myinfoVerified: true },
          },
          [STEP_2_NAME_ID]: {
            fieldType: BasicField.ShortText,
            answer: { value: 'Second Person' },
            question: 'Name',
            provenance: {},
          },
        }
        mockReq.formsg = {
          // The live form's login never applies to a later step.
          formDef: { ...MOCK_MYINFO_FORM_DEF, authType: FormAuthType.NIL },
          mrfSubmission: {
            workflowStep: 0,
            myInfoReadOnlyFields: [STEP_1_NAME_ID],
          },
          stepAuth: {
            workflowStep: 1,
            stepFields: [nameField(STEP_2_NAME_ID)],
            login: {
              authType: FormAuthType.MyInfo,
              isSubmitterIdCollectionEnabled: true,
              whitelist: { isWhitelistEnabled: false },
            },
            session: SESSION,
          },
        }
        return mockReq
      }

      it("should check only this step's fields against its login's hashes", async () => {
        jest
          .mocked(MyInfoService.fetchMyInfoHashes)
          .mockReturnValue(okAsync({ name: 'step-2-hash' }))
        jest
          .mocked(MyInfoService.checkMyInfoHashes)
          .mockReturnValue(okAsync(new Set([STEP_2_NAME_ID])))
        const mockNext = jest.fn()
        const mockReq = createStep2Req()

        await verifyMyInfoHashes(
          mockReq,
          toMiddlewareRes(createMockRes()),
          mockNext,
        )

        expect(mockNext).toHaveBeenCalled()
        expect(MyInfoUtil.extractMyInfoLoginJwt).not.toHaveBeenCalled()
        expect(MyInfoService.fetchMyInfoHashes).toHaveBeenCalledWith(
          SESSION.userName,
          MOCK_FORM_ID,
          SESSION.myInfoAuthSessionId,
        )
        expect(MyInfoService.checkMyInfoHashes).toHaveBeenCalledWith(
          [
            expect.objectContaining({
              _id: STEP_2_NAME_ID,
              answer: 'Second Person',
            }),
          ],
          { name: 'step-2-hash' },
        )
        // Earlier read-only fields are kept alongside this step's.
        expect(mockReq.formsg.myInfoReadOnlyFields).toEqual([
          STEP_1_NAME_ID,
          STEP_2_NAME_ID,
        ])
        expect(mockReq.body.responses[STEP_1_NAME_ID]).toEqual(
          expect.objectContaining({
            answer: { value: 'First Person' },
            provenance: { myinfoVerified: true },
          }),
        )
      })

      it("should reject a tampered answer on this step's MyInfo field", async () => {
        jest
          .mocked(MyInfoService.fetchMyInfoHashes)
          .mockReturnValue(okAsync({ name: 'step-2-hash' }))
        jest
          .mocked(MyInfoService.checkMyInfoHashes)
          .mockReturnValue(errAsync(new MyInfoHashDidNotMatchError()))
        const mockNext = jest.fn()
        const mockRes = createMockRes()

        await verifyMyInfoHashes(
          createStep2Req(),
          toMiddlewareRes(mockRes),
          mockNext,
        )

        expect(mockNext).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED)
      })

      it('should not need saved hashes for a login-only step', async () => {
        const mockNext = jest.fn()
        const mockReq = createStep2Req()
        mockReq.formsg.stepAuth.stepFields = [
          {
            _id: STEP_2_NAME_ID,
            fieldType: BasicField.ShortText,
            title: 'Name',
          },
        ]

        await verifyMyInfoHashes(
          mockReq,
          toMiddlewareRes(createMockRes()),
          mockNext,
        )

        expect(mockNext).toHaveBeenCalled()
        expect(MyInfoService.fetchMyInfoHashes).not.toHaveBeenCalled()
        // Nothing verified, so the stored list is left as is.
        expect(mockReq.formsg.myInfoReadOnlyFields).toBeUndefined()
        expect(mockReq.body.responses[STEP_2_NAME_ID].provenance).toEqual({})
      })

      it('should reject a MyInfo step without its verified login', async () => {
        const mockNext = jest.fn()
        const mockRes = createMockRes()
        const mockReq = createStep2Req()
        delete mockReq.formsg.stepAuth.session

        await verifyMyInfoHashes(mockReq, toMiddlewareRes(mockRes), mockNext)

        expect(mockNext).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED)
        expect(MyInfoService.fetchMyInfoHashes).not.toHaveBeenCalled()
      })
    })
  })

  describe('verifyMrfStepAuth', () => {
    const FORM_ID = new ObjectId().toHexString()
    const SUBMISSION_ID = new ObjectId().toHexString()
    const STEP_TOKEN = stepToken.generate()
    const STEP_TOKEN_HASH = stepToken.hash(STEP_TOKEN)
    const WHITELIST_ID = new ObjectId()
    const STEP_2_FIELD_ID = new ObjectId().toHexString()
    const MYINFO_STEP_AUTH = {
      auth_type: FormAuthType.MyInfo,
      is_submitter_id_collection_enabled: true,
      whitelisted_submitter_ids: {
        isWhitelistEnabled: true,
        encryptedWhitelistedSubmitterIds: WHITELIST_ID,
      },
    }
    const SESSION = {
      formId: FORM_ID,
      submissionId: SUBMISSION_ID,
      workflowStep: 1,
      authType: FormAuthType.MyInfo as const,
      stepTokenHash: STEP_TOKEN_HASH,
      userName: 'S7654321B',
      myInfoAuthSessionId: 'step-2-fapi-session',
    }

    const mintCookie = (session = SESSION) => {
      const res = { cookie: jest.fn() }
      setMrfStepAuthCookie(toMiddlewareRes(res), session)
      const [name, token] = res.cookie.mock.calls[0] as [string, string]
      return { [name]: token }
    }

    const createStepAuthReq = ({
      step2Auth = MYINFO_STEP_AUTH,
      cookies = {},
      presentedToken = STEP_TOKEN,
    }: {
      step2Auth?: unknown
      cookies?: Record<string, string>
      presentedToken?: string
    } = {}) => {
      const mockReq = createMockReq({
        formId: FORM_ID,
        submissionId: SUBMISSION_ID,
      })
      mockReq.body.stepToken = presentedToken
      mockReq.cookies = cookies
      mockReq.formsg = {
        // The live form has no login; the submission's copy decides.
        formDef: { _id: FORM_ID, authType: FormAuthType.NIL, publicKey: 'pk' },
        mrfSubmission: {
          _id: SUBMISSION_ID,
          form: new ObjectId(FORM_ID),
          workflowStep: 0,
          stepTokenHash: STEP_TOKEN_HASH,
          form_fields: [{ _id: STEP_2_FIELD_ID, title: 'Name' }],
          workflow: [
            { edit: [] },
            {
              edit: [STEP_2_FIELD_ID],
              ...(step2Auth ? { auth: step2Auth } : {}),
            },
          ],
          submittedSteps: [],
        },
      }
      return mockReq
    }
    const createStepAuthRes = () => ({
      ...createMockRes(),
      clearCookie: jest.fn(),
    })

    beforeEach(() => {
      jest.resetAllMocks()
      jest.mocked(OidcService.getOidcService).mockReturnValue({
        getCookieSettings: () => ({}),
        // Only the cookie settings are read when clearing
      } as never)
      jest
        .mocked(FormService.checkIsSubmitterNotWhitelisted)
        .mockReturnValue(okAsync(false))
    })

    it('should continue without a login for a step that has none', async () => {
      const mockNext = jest.fn()
      const mockReq = createStepAuthReq({ step2Auth: null })

      await verifyMrfStepAuth(
        mockReq,
        toMiddlewareRes(createStepAuthRes()),
        mockNext,
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockReq.formsg.stepAuth).toEqual({
        workflowStep: 1,
        stepFields: [{ _id: STEP_2_FIELD_ID, title: 'Name' }],
      })
    })

    it("should accept this step's login when the respondent is eligible", async () => {
      const mockNext = jest.fn()
      const mockReq = createStepAuthReq({ cookies: mintCookie() })

      await verifyMrfStepAuth(
        mockReq,
        toMiddlewareRes(createStepAuthRes()),
        mockNext,
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockReq.formsg.stepAuth.session).toMatchObject({
        userName: SESSION.userName,
        myInfoAuthSessionId: SESSION.myInfoAuthSessionId,
      })
      // Eligibility is checked against the list saved on the submission.
      expect(FormService.checkIsSubmitterNotWhitelisted).toHaveBeenCalledWith({
        formId: FORM_ID,
        formPublicKey: 'pk',
        whitelistId: String(WHITELIST_ID),
        submitterId: SESSION.userName,
      })
    })

    it.each([
      ['no login', {}],
      [
        "only Step 1's global login cookies",
        { MyInfoCookie: 'global-myinfo', jwtCp: 'global-cp' },
      ],
    ])(
      'should reject a protected step with %s before processing',
      async (_, cookies: Record<string, string>) => {
        const mockNext = jest.fn()
        const mockRes = createStepAuthRes()

        await verifyMrfStepAuth(
          createStepAuthReq({ cookies }),
          toMiddlewareRes(mockRes),
          mockNext,
        )

        expect(mockNext).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED)
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({ spcpSubmissionFailure: true }),
        )
      },
    )

    it.each([
      ['another step', { workflowStep: 2 }],
      ['an older step token', { stepTokenHash: 'older-token-hash' }],
      ['another submission', { submissionId: new ObjectId().toHexString() }],
    ])(
      'should reject and clear a login for %s',
      async (_, change: Partial<typeof SESSION>) => {
        const mockNext = jest.fn()
        const mockRes = createStepAuthRes()
        const session = { ...SESSION, ...change }
        const cookies = mintCookie(session)
        // Presented under this submission's cookie name
        const [token] = Object.values(cookies)

        await verifyMrfStepAuth(
          createStepAuthReq({
            cookies: { [getMrfStepAuthCookieName(SESSION)]: token },
          }),
          toMiddlewareRes(mockRes),
          mockNext,
        )

        expect(mockNext).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED)
        expect(mockRes.clearCookie).toHaveBeenCalledWith(
          getMrfStepAuthCookieName(SESSION),
          expect.objectContaining({ path: `/api/v3/forms/${FORM_ID}` }),
        )
      },
    )

    it('should reject an ineligible respondent', async () => {
      jest
        .mocked(FormService.checkIsSubmitterNotWhitelisted)
        .mockReturnValue(okAsync(true))
      const mockNext = jest.fn()
      const mockRes = createStepAuthRes()

      await verifyMrfStepAuth(
        createStepAuthReq({ cookies: mintCookie() }),
        toMiddlewareRes(mockRes),
        mockNext,
      )

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      expect(mockRes.clearCookie).toHaveBeenCalled()
    })

    it('should fail closed when the eligible-respondent list cannot be read', async () => {
      jest
        .mocked(FormService.checkIsSubmitterNotWhitelisted)
        .mockReturnValue(errAsync(new FormWhitelistSettingNotFoundError()))
      const mockNext = jest.fn()
      const mockRes = createStepAuthRes()

      await verifyMrfStepAuth(
        createStepAuthReq({ cookies: mintCookie() }),
        toMiddlewareRes(mockRes),
        mockNext,
      )

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    })

    it('should reject a wrong step token before checking the login', async () => {
      const mockNext = jest.fn()
      const mockRes = createStepAuthRes()

      await verifyMrfStepAuth(
        createStepAuthReq({
          cookies: mintCookie(),
          presentedToken: stepToken.generate(),
        }),
        toMiddlewareRes(mockRes),
        mockNext,
      )

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      expect(FormService.checkIsSubmitterNotWhitelisted).not.toHaveBeenCalled()
    })
  })

  describe('encryptSubmission', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()

    const MOCK_FORM_KEYPAIR = nacl.box.keyPair()
    const MOCK_FORM_PUBLIC_KEY = encodeBase64(MOCK_FORM_KEYPAIR.publicKey)
    const MOCK_FORM_SECRET_KEY = encodeBase64(MOCK_FORM_KEYPAIR.secretKey)

    const MOCK_FORM_BASE = {
      _id: MOCK_FORM_ID,
      publicKey: MOCK_FORM_PUBLIC_KEY,
      admin: { email: 'admin@example.com' },
      form_fields: [
        { _id: 'field1', fieldType: BasicField.ShortText, title: 'Field 1' },
      ],
    } as any

    const MOCK_RESPONSES = {
      field1: {
        fieldType: BasicField.ShortText,
        answer: 'hello',
        question: 'Field 1',
        provenance: {},
      },
    }

    const createMockEncryptReq = (hasWebhook: boolean) =>
      ({
        params: { formId: MOCK_FORM_ID },
        body: {
          responses: { ...MOCK_RESPONSES },
          version: 1,
          workflowStep: 0,
          responseMetadata: {},
        },
        formsg: {
          formDef: hasWebhook
            ? {
                ...MOCK_FORM_BASE,
                webhook: { url: 'https://example.com/webhook' },
              }
            : MOCK_FORM_BASE,
        },
        growthbook: {
          isOn: jest.fn().mockReturnValue(false),
          setAttributes: jest.fn().mockResolvedValue(undefined),
          getAttributes: jest.fn().mockReturnValue({}),
        },
        get: jest.fn((name: string) => {
          if (name === 'cf-connecting-ip') return '127.0.0.1'
          if (name === 'cf-ray') return 'mock-cf-ray'
          return undefined
        }),
        ip: '127.0.0.1',
        id: 'mock-request-id',
        headers: {
          'cf-connecting-ip': '127.0.0.1',
          'cf-ray': 'mock-cf-ray',
          'x-request-id': 'mock-request-id',
        },
        baseUrl: '/api/v3',
        path: '/forms/mock-form-id/submissions',
        originalUrl: '/api/v3/forms/mock-form-id/submissions',
      }) as any

    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetAllMocks()
      ;(formsgSdk.cryptoV3.encrypt as jest.Mock).mockReturnValue({
        encryptedContent: 'mock-encrypted-content',
        encryptedSubmissionSecretKey: 'mock-esk',
        submissionSecretKey: 'mock-ssk',
        submissionPublicKey: 'mock-spk',
      })
      const mockDecrypt = formsgSdk.cryptoV3
        .decryptFromSubmissionKey as jest.Mock
      mockDecrypt.mockReturnValue({ responses: MOCK_RESPONSES })
    })

    it('should encrypt responses as V4 and set mrfVersion to 2 when the form has a generic webhook url', async () => {
      jest.mocked(adaptV4ToV3).mockReturnValue({
        field1: { fieldType: BasicField.ShortText, answer: 'hello' },
      } as any)

      const mockReq = createMockEncryptReq(true)
      const mockNext = jest.fn()
      const mockRes = createMockRes()

      await encryptSubmission(mockReq, mockRes as any, mockNext)

      expect(jest.mocked(adaptV4ToV3)).not.toHaveBeenCalled()
      expect(mockReq.formsg.encryptedPayload.mrfVersion).toBe(2)
      expect(mockNext).toHaveBeenCalled()
    })

    it('carries verified field IDs through encryption and NDI handling without fetching hashes again', async () => {
      const mockReq = createMockEncryptReq(false)
      mockReq.formsg.formDef.authType = FormAuthType.MyInfo
      jest
        .mocked(MyInfoService.fetchMyInfoHashes)
        .mockReturnValue(okAsync({ name: 'hash' }))
      jest
        .mocked(MyInfoService.checkMyInfoHashes)
        .mockReturnValue(okAsync(new Set(['field1'])))
      jest
        .mocked(VerifiedContentService.getVerifiedContent)
        .mockReturnValue(ok({ uinFin: 'S1234567A' }))
      jest.mocked(MyInfoUtil.extractMyInfoLoginJwt).mockReturnValue(ok('jwt'))
      jest
        .mocked(MyInfoService.verifyLoginJwt)
        .mockReturnValue(ok({ uinFin: 'S1234567A' }))
      const mockRes = createMockRes()

      await verifyMyInfoHashes(mockReq, mockRes as any, jest.fn())
      await encryptSubmission(mockReq, mockRes as any, jest.fn())
      await handleNdiResponses(mockReq, mockRes as any, jest.fn())

      expect(mockReq.formsg.encryptedPayload.myInfoReadOnlyFields).toEqual([
        'field1',
      ])
      expect(MyInfoService.fetchMyInfoHashes).toHaveBeenCalledTimes(1)
    })

    it('should return 500 and not call next() when decryptFromSubmissionKey returns falsy', async () => {
      const mockDecrypt = formsgSdk.cryptoV3
        .decryptFromSubmissionKey as jest.Mock
      mockDecrypt.mockReturnValue(null)

      const mockReq = createMockEncryptReq(false)
      const mockNext = jest.fn()
      const mockRes = createMockRes()

      await encryptSubmission(mockReq, mockRes as any, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalled()
      expect(mockNext).not.toHaveBeenCalled()
    })

    describe('step-token mint', () => {
      const unwrapStepToken = (
        encryptedStepToken: string,
        formSecretKey: string,
      ): string | null => {
        const [senderPublicKey, nonceAndCipher] = encryptedStepToken.split(';')
        const [nonce, cipher] = nonceAndCipher.split(':').map(decodeBase64)
        const opened = nacl.box.open(
          cipher,
          nonce,
          decodeBase64(senderPublicKey),
          decodeBase64(formSecretKey),
        )
        return opened ? encodeUTF8(opened) : null
      }

      it('should mint a step token whose hash and wrapped copy match the raw token', async () => {
        const mockReq = createMockEncryptReq(false)
        const mockNext = jest.fn()
        const mockRes = createMockRes()

        await encryptSubmission(mockReq, mockRes as any, mockNext)

        const payload = mockReq.formsg.encryptedPayload
        expect(payload.stepToken).toEqual(expect.any(String))
        // Hash on the row verifies against the raw token in the link.
        expect(payload.stepTokenHash).toBe(stepToken.hash(payload.stepToken))
        // Wrapped copy unwraps (with the form secret key) to the same raw token.
        expect(
          unwrapStepToken(payload.encryptedStepToken, MOCK_FORM_SECRET_KEY),
        ).toBe(payload.stepToken)
        expect(mockNext).toHaveBeenCalled()
      })

      it('should mint a fresh, unique token on each advance (rotation)', async () => {
        const run = async () => {
          const mockReq = createMockEncryptReq(false)
          await encryptSubmission(mockReq, createMockRes() as any, jest.fn())
          return mockReq.formsg.encryptedPayload.stepToken as string
        }
        expect(await run()).not.toBe(await run())
      })
    })

    describe('mrf version gate', () => {
      const PLUMBER_URL = 'https://plumber.gov.sg/webhooks/abc'
      const ZAPIER_URL = 'https://hooks.zapier.com/hooks/catch/123/abc'
      const GENERIC_URL = 'https://example.com/hook'
      const V3_ADAPTED = {
        field1: { fieldType: BasicField.ShortText, answer: 'hello' },
      }

      const runGate = async ({
        webhookUrl,
        webhookFormat,
        flags = [],
      }: {
        webhookUrl?: string
        webhookFormat?: 'v1' | 'v4'
        flags?: string[]
      }) => {
        jest.mocked(adaptV4ToV3).mockClear()
        jest.mocked(adaptV4ToV3).mockReturnValue(V3_ADAPTED as any)
        jest.mocked(formsgSdk.cryptoV3.encrypt).mockClear()
        const mockReq = createMockEncryptReq(false)
        if (webhookUrl) {
          mockReq.formsg.formDef = {
            ...MOCK_FORM_BASE,
            webhook: { url: webhookUrl, isRetryEnabled: false, webhookFormat },
          }
        }
        mockReq.growthbook.isOn = jest.fn((flag: string) =>
          flags.includes(flag),
        )
        await encryptSubmission(mockReq, createMockRes() as any, jest.fn())
        return mockReq
      }

      const expectEncryptedAs = (
        mockReq: Awaited<ReturnType<typeof runGate>>,
        expected: 1 | 2,
      ) => {
        expect(mockReq.formsg.encryptedPayload.mrfVersion).toBe(expected)
        if (expected === 2) {
          // V4: encrypt the in-process responses as-is; do not downgrade.
          expect(jest.mocked(adaptV4ToV3)).not.toHaveBeenCalled()
          expect(jest.mocked(formsgSdk.cryptoV3.encrypt)).toHaveBeenCalledWith(
            MOCK_RESPONSES,
            MOCK_FORM_PUBLIC_KEY,
          )
        } else {
          // V3: downgrade via adaptV4ToV3, then encrypt the adapted shape.
          expect(jest.mocked(adaptV4ToV3)).toHaveBeenCalledWith(MOCK_RESPONSES)
          expect(jest.mocked(formsgSdk.cryptoV3.encrypt)).toHaveBeenCalledWith(
            V3_ADAPTED,
            MOCK_FORM_PUBLIC_KEY,
          )
        }
      }

      describe('always V4 regardless of webhook URL', () => {
        it('plumber.gov.sg is V4', async () => {
          expectEncryptedAs(await runGate({ webhookUrl: PLUMBER_URL }), 2)
        })

        it('example.com is V4', async () => {
          expectEncryptedAs(await runGate({ webhookUrl: GENERIC_URL }), 2)
        })

        it('hooks.zapier.com is V4', async () => {
          expectEncryptedAs(await runGate({ webhookUrl: ZAPIER_URL }), 2)
        })

        it('no webhook URL is V4', async () => {
          expectEncryptedAs(await runGate({ flags: [] }), 2)
        })
      })

      describe('ignored inputs that never affect the row version', () => {
        it('ignores webhookFormat on plumber (v1 still V4)', async () => {
          expectEncryptedAs(
            await runGate({
              webhookUrl: PLUMBER_URL,
              webhookFormat: 'v1',
            }),
            2,
          )
        })

        it('ignores webhookFormat and enableMrfWebhooks on generic (V4 either way)', async () => {
          expectEncryptedAs(
            await runGate({
              webhookUrl: GENERIC_URL,
              webhookFormat: 'v1',
              flags: [featureFlags.enableMrfWebhooks],
            }),
            2,
          )
          expectEncryptedAs(
            await runGate({
              webhookUrl: GENERIC_URL,
              webhookFormat: 'v4',
              flags: [],
            }),
            2,
          )
        })

        it('ignores webhookFormat and enableMrfWebhooks on zapier (V4 either way)', async () => {
          expectEncryptedAs(
            await runGate({
              webhookUrl: ZAPIER_URL,
              webhookFormat: 'v1',
              flags: [featureFlags.enableMrfWebhooks],
            }),
            2,
          )
          expectEncryptedAs(
            await runGate({
              webhookUrl: ZAPIER_URL,
              webhookFormat: 'v4',
              flags: [],
            }),
            2,
          )
        })
      })
    })
  })

  describe('validateMultirespondentSubmission', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const MOCK_SUBMISSION_ID = new ObjectId().toHexString()

    const EDITABLE_FIELD_ID = 'field1'
    const NON_EDITABLE_FIELD_ID = 'field2'

    const SNAPSHOT_FORM_FIELDS = [
      {
        _id: EDITABLE_FIELD_ID,
        fieldType: BasicField.ShortText,
        title: 'Editable Field',
      },
      {
        _id: NON_EDITABLE_FIELD_ID,
        fieldType: BasicField.ShortText,
        title: 'Non-editable Field',
      },
    ]

    const SNAPSHOT_WORKFLOW = [
      { step: 0, edit: [EDITABLE_FIELD_ID, NON_EDITABLE_FIELD_ID] },
      { step: 1, edit: [EDITABLE_FIELD_ID] }, // only field1 editable at step 1
    ]

    // mrfVersion: 1 means previous submission was encrypted in V3 format
    // workflowStep: 0 means the current incoming submission is at step 1
    const MOCK_MRF_SUBMISSION_V1 = {
      form: MOCK_FORM_ID,
      encryptedContent: 'v3-encrypted-content',
      version: 1,
      mrfVersion: 1,
      form_fields: SNAPSHOT_FORM_FIELDS,
      form_logics: [],
      workflow: SNAPSHOT_WORKFLOW,
      workflowStep: 0,
      _id: new ObjectId(),
      created: new Date(),
      modified: new Date(),
      submissionType: 'Multirespondent',
      authType: FormAuthType.NIL,
      getWebhookView: jest.fn(),
    } as any

    // V3 decrypted responses returned by decryptFromSubmissionKey for a V3-encrypted previous submission
    const MOCK_V3_DECRYPTED_RESPONSES = {
      [EDITABLE_FIELD_ID]: {
        fieldType: BasicField.ShortText,
        answer: 'original',
      },
      [NON_EDITABLE_FIELD_ID]: {
        fieldType: BasicField.ShortText,
        answer: 'locked-value',
      },
    }

    // V4 responses produced by adaptV3ToV4 (V4 shape with provenance)
    const MOCK_V4_ADAPTED_RESPONSES = {
      [EDITABLE_FIELD_ID]: {
        fieldType: BasicField.ShortText,
        answer: { value: 'original' },
        question: 'Editable Field',
        provenance: {},
      },
      [NON_EDITABLE_FIELD_ID]: {
        fieldType: BasicField.ShortText,
        answer: { value: 'locked-value' },
        question: 'Non-editable Field',
        provenance: {},
      },
    }

    const ALL_VISIBLE_FIELD_IDS = new Set([
      EDITABLE_FIELD_ID,
      NON_EDITABLE_FIELD_ID,
    ])

    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetAllMocks()
      ;(
        formsgSdk.cryptoV3.decryptFromSubmissionKey as jest.Mock
      ).mockReturnValue({
        responses: MOCK_V3_DECRYPTED_RESPONSES,
        verified: {},
        submissionSecretKey: '',
      })

      // Previous decrypted responses are V3-shaped, so isFieldResponsesV4 must return false
      // to trigger the V3->V4 adaptation path
      jest.mocked(isFieldResponsesV4).mockReturnValue(false)

      jest.mocked(adaptV3ToV4).mockReturnValue(MOCK_V4_ADAPTED_RESPONSES as any)

      // adaptV4ToV3 is still called once on req.body.responses for logic evaluation
      jest
        .mocked(adaptV4ToV3)
        .mockReturnValue(MOCK_V3_DECRYPTED_RESPONSES as any)

      jest
        .mocked(LogicAdaptor.getVisibleFieldIdsV3)
        .mockReturnValue(ok(ALL_VISIBLE_FIELD_IDS) as any)

      jest
        .mocked(LogicAdaptor.getLogicUnitPreventingSubmitV3)
        .mockReturnValue(ok(undefined) as any)

      jest
        .mocked(MrfUtils.validateMrfFieldResponses)
        .mockReturnValue(ok(MOCK_V4_ADAPTED_RESPONSES) as any)
    })

    it('should call adaptV3ToV4 and call next when previous mrfVersion is 1 and non-editable fields match', async () => {
      const mockReq = createMockReq({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
      })
      mockReq.body.responses = {
        [EDITABLE_FIELD_ID]: {
          fieldType: BasicField.ShortText,
          answer: { value: 'updated' },
          question: 'Editable Field',
          provenance: {},
        },
        [NON_EDITABLE_FIELD_ID]: {
          fieldType: BasicField.ShortText,
          answer: { value: 'locked-value' },
          question: 'Non-editable Field',
          provenance: {},
        },
      }
      mockReq.body.submissionSecretKey = 'submission-secret-key'
      mockReq.formsg = {
        formDef: {
          _id: MOCK_FORM_ID,
          form_fields: SNAPSHOT_FORM_FIELDS,
          form_logics: [],
          workflow: SNAPSHOT_WORKFLOW,
        },
        mrfSubmission: MOCK_MRF_SUBMISSION_V1,
      }

      const mockNext = jest.fn()
      const mockRes = createMockRes()

      await validateMultirespondentSubmission(mockReq, mockRes as any, mockNext)

      expect(jest.mocked(adaptV3ToV4)).toHaveBeenCalledWith(
        MOCK_V3_DECRYPTED_RESPONSES,
        { formFields: {}, provenance: {} },
      )
      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject submission when a non-editable field is tampered after V3-to-V4 conversion', async () => {
      const mockReq = createMockReq({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
      })
      mockReq.body.responses = {
        [EDITABLE_FIELD_ID]: {
          fieldType: BasicField.ShortText,
          answer: { value: 'updated' },
          question: 'Editable Field',
          provenance: {},
        },
        [NON_EDITABLE_FIELD_ID]: {
          fieldType: BasicField.ShortText,
          answer: { value: 'tampered' }, // differs from 'locked-value'
          question: 'Non-editable Field',
          provenance: {},
        },
      }
      mockReq.body.submissionSecretKey = 'submission-secret-key'
      mockReq.formsg = {
        formDef: {
          _id: MOCK_FORM_ID,
          form_fields: SNAPSHOT_FORM_FIELDS,
          form_logics: [],
          workflow: SNAPSHOT_WORKFLOW,
        },
        mrfSubmission: MOCK_MRF_SUBMISSION_V1,
      }

      const mockNext = jest.fn()
      const mockRes = createMockRes()

      await validateMultirespondentSubmission(mockReq, mockRes as any, mockNext)

      expect(jest.mocked(adaptV3ToV4)).toHaveBeenCalledWith(
        MOCK_V3_DECRYPTED_RESPONSES,
        { formFields: {}, provenance: {} },
      )
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('should carry forward server-owned provenance from the previous response on re-submitted non-editable fields', async () => {
      // Previous submission is V4-encrypted, with myinfoVerified stamped at
      // step 1 on the non-editable field.
      const previousV4Responses = {
        [EDITABLE_FIELD_ID]: {
          fieldType: BasicField.ShortText,
          answer: { value: 'original' },
          question: 'Editable Field',
          provenance: {},
        },
        [NON_EDITABLE_FIELD_ID]: {
          fieldType: BasicField.ShortText,
          answer: { value: 'locked-value' },
          question: 'Non-editable Field',
          provenance: { myinfoVerified: true },
        },
      }
      ;(
        formsgSdk.cryptoV3.decryptFromSubmissionKey as jest.Mock
      ).mockReturnValue({
        responses: previousV4Responses,
        verified: {},
        submissionSecretKey: '',
      })
      jest.mocked(isFieldResponsesV4).mockReturnValue(true)

      const mockReq = createMockReq({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
      })
      // Step-2 carry-forward: client re-submits the non-editable field, but
      // Joi has stripped its provenance.
      mockReq.body.responses = {
        [EDITABLE_FIELD_ID]: {
          fieldType: BasicField.ShortText,
          answer: { value: 'updated' },
          question: 'Editable Field',
          provenance: {},
        },
        [NON_EDITABLE_FIELD_ID]: {
          fieldType: BasicField.ShortText,
          answer: { value: 'locked-value' },
          question: 'Non-editable Field',
          provenance: {},
        },
      }
      mockReq.body.submissionSecretKey = 'submission-secret-key'
      mockReq.formsg = {
        formDef: {
          _id: MOCK_FORM_ID,
          form_fields: SNAPSHOT_FORM_FIELDS,
          form_logics: [],
          workflow: SNAPSHOT_WORKFLOW,
        },
        mrfSubmission: { ...MOCK_MRF_SUBMISSION_V1, mrfVersion: 2 },
      }

      const mockNext = jest.fn()
      const mockRes = createMockRes()

      await validateMultirespondentSubmission(mockReq, mockRes as any, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockReq.body.responses[NON_EDITABLE_FIELD_ID].provenance).toEqual({
        myinfoVerified: true,
      })
    })

    describe('step-token write-guard', () => {
      const RAW_STEP_TOKEN = stepToken.generate()

      // Build a request whose decrypt-gate will pass (matching the beforeEach
      // mocks), varying only the step-token bits.
      const createGuardReq = ({
        stepTokenHash,
        presentedToken,
      }: {
        stepTokenHash?: string
        presentedToken?: string
      }) => {
        const mockReq = createMockReq({
          formId: MOCK_FORM_ID,
          submissionId: MOCK_SUBMISSION_ID,
        })
        mockReq.body.responses = {
          [EDITABLE_FIELD_ID]: {
            fieldType: BasicField.ShortText,
            answer: { value: 'updated' },
            question: 'Editable Field',
            provenance: {},
          },
          [NON_EDITABLE_FIELD_ID]: {
            fieldType: BasicField.ShortText,
            answer: { value: 'locked-value' },
            question: 'Non-editable Field',
            provenance: {},
          },
        }
        mockReq.body.submissionSecretKey = 'submission-secret-key'
        mockReq.body.stepToken = presentedToken
        mockReq.growthbook = { isOn: jest.fn(() => false) }
        mockReq.formsg = {
          formDef: {
            _id: MOCK_FORM_ID,
            form_fields: SNAPSHOT_FORM_FIELDS,
            form_logics: [],
            workflow: SNAPSHOT_WORKFLOW,
          },
          mrfSubmission: { ...MOCK_MRF_SUBMISSION_V1, stepTokenHash },
        }
        return mockReq
      }

      it('should advance when a valid step token accompanies a valid decrypt', async () => {
        const mockReq = createGuardReq({
          stepTokenHash: stepToken.hash(RAW_STEP_TOKEN),
          presentedToken: RAW_STEP_TOKEN,
        })
        const mockNext = jest.fn()
        const mockRes = createMockRes()

        await validateMultirespondentSubmission(
          mockReq,
          mockRes as any,
          mockNext,
        )

        expect(mockNext).toHaveBeenCalled()
        expect(mockRes.status).not.toHaveBeenCalled()
      })

      it('should return 403 and not advance when the presented token is wrong (decrypt still valid)', async () => {
        const mockReq = createGuardReq({
          stepTokenHash: stepToken.hash(RAW_STEP_TOKEN),
          presentedToken: stepToken.generate(), // wrong token
        })
        const mockNext = jest.fn()
        const mockRes = createMockRes()

        await validateMultirespondentSubmission(
          mockReq,
          mockRes as any,
          mockNext,
        )

        expect(mockNext).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      })

      it('should return 403 when the token is absent but the row carries a hash (decrypt-gate alone no longer advances)', async () => {
        const mockReq = createGuardReq({
          stepTokenHash: stepToken.hash(RAW_STEP_TOKEN),
          presentedToken: undefined, // absent
        })
        const mockNext = jest.fn()
        const mockRes = createMockRes()

        await validateMultirespondentSubmission(
          mockReq,
          mockRes as any,
          mockNext,
        )

        expect(mockNext).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      })

      it('should reject a tokenless update to a zero-step submission (hash on row, raw token never delivered)', async () => {
        // The guard itself is purely token-based — it knows nothing about
        // payments. The payment-terminality guarantee (no post-payment edits)
        // falls out of it structurally: a payment-enabled form is necessarily
        // zero-step, the step token is minted at creation but its raw value
        // is only ever delivered via next-step email links, and a zero-step
        // form sends none — so no caller can ever present a valid token.
        const mockReq = createGuardReq({
          stepTokenHash: stepToken.hash(RAW_STEP_TOKEN),
          presentedToken: undefined, // nobody ever received the raw token
        })
        // Zero-step everywhere it is recorded: the form definition and the
        // submission's workflow snapshot must agree for the fixture to
        // describe a real row (updates read the snapshot, creates the form).
        mockReq.formsg.formDef.workflow = []
        mockReq.formsg.mrfSubmission = {
          ...mockReq.formsg.mrfSubmission,
          workflow: [],
          workflowStep: 0,
        }
        const mockNext = jest.fn()
        const mockRes = createMockRes()

        await validateMultirespondentSubmission(
          mockReq,
          mockRes as any,
          mockNext,
        )

        expect(mockNext).not.toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      })

      it('should advance on a legacy row without a hash even with no token (migration grace)', async () => {
        const mockReq = createGuardReq({
          stepTokenHash: undefined, // legacy in-flight row
          presentedToken: undefined,
        })
        const mockNext = jest.fn()
        const mockRes = createMockRes()

        await validateMultirespondentSubmission(
          mockReq,
          mockRes as any,
          mockNext,
        )

        expect(mockNext).toHaveBeenCalled()
        expect(mockRes.status).not.toHaveBeenCalled()
      })
    })
  })

  describe('validatePaymentSubmission', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()
    const PRODUCT_ID = new ObjectId().toHexString()

    const PRODUCT_DEFINITION = {
      _id: PRODUCT_ID,
      name: 'Product A',
      description: 'A product',
      multi_qty: false,
      min_qty: 1,
      max_qty: 1,
      amount_cents: 100_00,
    }

    // Uses the real PaymentsService.validatePaymentProducts, so these tests
    // pin the full tamper-rejection behavior, not just the wiring.
    const createPaymentReq = ({
      formProducts,
      paymentProducts,
    }: {
      formProducts?: unknown
      paymentProducts?: unknown
    }) => {
      const req = createMockReq({ formId: MOCK_FORM_ID })
      req.formsg = {
        formDef: {
          toObject: () => ({
            _id: MOCK_FORM_ID,
            payments_field: formProducts
              ? { enabled: true, products: formProducts }
              : undefined,
          }),
        },
      }
      if (paymentProducts) req.body.paymentProducts = paymentProducts
      return req
    }

    it('should call next when the submission carries no payment products', async () => {
      const mockReq = createPaymentReq({
        formProducts: [PRODUCT_DEFINITION],
      })
      const mockRes = createMockRes()
      const mockNext = jest.fn()

      await validatePaymentSubmission(mockReq, mockRes as any, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should call next when submitted products match the form definition', async () => {
      const mockReq = createPaymentReq({
        formProducts: [PRODUCT_DEFINITION],
        paymentProducts: [
          { data: PRODUCT_DEFINITION, selected: true, quantity: 1 },
        ],
      })
      const mockRes = createMockRes()
      const mockNext = jest.fn()

      await validatePaymentSubmission(mockReq, mockRes as any, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should return 400 when payment products are submitted to a form without product definitions', async () => {
      const mockReq = createPaymentReq({
        paymentProducts: [
          { data: PRODUCT_DEFINITION, selected: true, quantity: 1 },
        ],
      })
      const mockRes = createMockRes()
      const mockNext = jest.fn()

      await validatePaymentSubmission(mockReq, mockRes as any, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })

    it('should return 400 when a submitted product price is tampered', async () => {
      const mockReq = createPaymentReq({
        formProducts: [PRODUCT_DEFINITION],
        paymentProducts: [
          {
            data: { ...PRODUCT_DEFINITION, amount_cents: 50 },
            selected: true,
            quantity: 1,
          },
        ],
      })
      const mockRes = createMockRes()
      const mockNext = jest.fn()

      await validatePaymentSubmission(mockReq, mockRes as any, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })

    it('should return 400 when quantity exceeds the single-quantity limit', async () => {
      const mockReq = createPaymentReq({
        formProducts: [PRODUCT_DEFINITION],
        paymentProducts: [
          { data: PRODUCT_DEFINITION, selected: true, quantity: 2 },
        ],
      })
      const mockRes = createMockRes()
      const mockNext = jest.fn()

      await validatePaymentSubmission(mockReq, mockRes as any, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })

    it('should return 400 when the same product is selected twice', async () => {
      const mockReq = createPaymentReq({
        formProducts: [PRODUCT_DEFINITION],
        paymentProducts: [
          { data: PRODUCT_DEFINITION, selected: true, quantity: 1 },
          { data: PRODUCT_DEFINITION, selected: true, quantity: 1 },
        ],
      })
      const mockRes = createMockRes()
      const mockNext = jest.fn()

      await validatePaymentSubmission(mockReq, mockRes as any, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })
  })
})
