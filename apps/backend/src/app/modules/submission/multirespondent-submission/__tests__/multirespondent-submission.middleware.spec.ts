import {
  adaptV3ToV4,
  adaptV4ToV3,
  isFieldResponsesV4,
} from '@opengovsg/formsg-sdk/adapters'
import { ObjectId } from 'bson'
import { featureFlags } from 'formsg-shared/constants'
import { BasicField, FormAuthType, FormResponseMode } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'
import { errAsync, ok, okAsync } from 'neverthrow'
import nacl from 'tweetnacl'
import { decodeBase64, encodeBase64, encodeUTF8 } from 'tweetnacl-util'

import formsgSdk from 'src/app/config/formsg-sdk'
import { MyInfoService } from 'src/app/modules/myinfo/myinfo.service'
import * as MyInfoUtil from 'src/app/modules/myinfo/myinfo.util'
import * as OidcService from 'src/app/modules/spcp/spcp.oidc.service'
import * as SpcpUtil from 'src/app/modules/spcp/spcp.util'
import * as VerifiedContentService from 'src/app/modules/verified-content/verified-content.service'
import * as LogicAdaptor from 'src/app/utils/logic-adaptor'

import * as FeatureFlagService from '../../../feature-flags/feature-flags.service'
import * as FormService from '../../../form/form.service'
import { SubmissionNotFoundError } from '../../submission.errors'
import { generateHashedSubmitterId } from '../../submission.utils'
import {
  createFormsgAndRetrieveForm,
  encryptSubmission,
  handleNdiResponses,
  validateMultirespondentRemindBody,
  validateMultirespondentSubmission,
} from '../multirespondent-submission.middleware'
import {
  checkFormIsMultirespondent,
  getMultirespondentSubmission,
} from '../multirespondent-submission.service'
import * as MrfUtils from '../multirespondent-submission.utils'
import * as stepToken from '../step-token'

jest.mock('../../../feature-flags/feature-flags.service')
jest.mock('../../../form/form.service')
jest.mock('../multirespondent-submission.service')
jest.mock('../../../spcp/spcp.oidc.service')
jest.mock('../../../myinfo/myinfo.service')
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
jest.mock('../multirespondent-submission.utils')
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
  })

  describe('encryptSubmission', () => {
    const MOCK_FORM_ID = new ObjectId().toHexString()

    const MOCK_FORM_KEYPAIR = nacl.box.keyPair()
    const MOCK_FORM_PUBLIC_KEY = encodeBase64(MOCK_FORM_KEYPAIR.publicKey)
    const MOCK_FORM_SECRET_KEY = encodeBase64(MOCK_FORM_KEYPAIR.secretKey)

    const MOCK_FORM_BASE = {
      _id: MOCK_FORM_ID,
      publicKey: MOCK_FORM_PUBLIC_KEY,
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

    it('should encrypt responses as V3 and set mrfVersion to 1 when form has a webhook url', async () => {
      jest.mocked(adaptV4ToV3).mockReturnValue({
        field1: { fieldType: BasicField.ShortText, answer: 'hello' },
      } as any)

      const mockReq = createMockEncryptReq(true)
      const mockNext = jest.fn()
      const mockRes = createMockRes()

      await encryptSubmission(mockReq, mockRes as any, mockNext)

      expect(jest.mocked(adaptV4ToV3)).toHaveBeenCalledWith(MOCK_RESPONSES)
      expect(mockReq.formsg.encryptedPayload.mrfVersion).toBe(1)
      expect(mockNext).toHaveBeenCalled()
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

      it('should mint a step token whose hash and wrapped copy match the raw token when the flag is on', async () => {
        const mockReq = createMockEncryptReq(false)
        mockReq.growthbook.isOn = jest.fn(
          (flag: string) => flag === featureFlags.mrfStepWriteToken,
        )
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

      it('should not mint a step token when the flag is off (flag-off path unchanged)', async () => {
        const mockReq = createMockEncryptReq(false)
        const mockNext = jest.fn()
        const mockRes = createMockRes()

        await encryptSubmission(mockReq, mockRes as any, mockNext)

        const payload = mockReq.formsg.encryptedPayload
        expect(payload.stepToken).toBeUndefined()
        expect(payload.stepTokenHash).toBeUndefined()
        expect(payload.encryptedStepToken).toBeUndefined()
        expect(mockNext).toHaveBeenCalled()
      })

      it('should mint a fresh, unique token on each advance (rotation)', async () => {
        const run = async () => {
          const mockReq = createMockEncryptReq(false)
          mockReq.growthbook.isOn = jest.fn(
            (flag: string) => flag === featureFlags.mrfStepWriteToken,
          )
          await encryptSubmission(mockReq, createMockRes() as any, jest.fn())
          return mockReq.formsg.encryptedPayload.stepToken as string
        }
        expect(await run()).not.toBe(await run())
      })
    })

    describe('V4-encryption gate', () => {
      // PRD #9740: V4 is the in-process shape; the encryption blob is only
      // downgraded to V3 for consumer classes that cannot read V4 yet.
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
        jest.mocked(adaptV4ToV3).mockReturnValue(V3_ADAPTED as any)
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

      const BOTH_FLAGS = [
        featureFlags.enableMrfWebhooks,
        featureFlags.mrfStepWriteToken,
      ]

      it.each([
        {
          name: 'no-webhook form is V4 with both flags off',
          flags: [],
          expected: 2,
        },
        {
          name: 'no-webhook form is V4 with both flags on',
          flags: BOTH_FLAGS,
          expected: 2,
        },
        {
          name: 'plumber webhook is V4 when mrfStepWriteToken is on',
          webhookUrl: PLUMBER_URL,
          flags: [featureFlags.mrfStepWriteToken],
          expected: 2,
        },
        {
          name: 'plumber webhook stays V3 when mrfStepWriteToken is off',
          webhookUrl: PLUMBER_URL,
          flags: [featureFlags.enableMrfWebhooks],
          expected: 1,
        },
        {
          name: 'generic webhook is V4 when it opts into v4 and both flags are on',
          webhookUrl: GENERIC_URL,
          webhookFormat: 'v4' as const,
          flags: BOTH_FLAGS,
          expected: 2,
        },
        {
          // Security: never ship a V4 encryptedSubmissionSecretKey to a generic
          // consumer without the step-token write-guard, even with every other
          // v4 condition met.
          name: 'generic webhook stays V3 when mrfStepWriteToken is off',
          webhookUrl: GENERIC_URL,
          webhookFormat: 'v4' as const,
          flags: [featureFlags.enableMrfWebhooks],
          expected: 1,
        },
        {
          name: 'generic webhook stays V3 when webhookFormat is v1',
          webhookUrl: GENERIC_URL,
          webhookFormat: 'v1' as const,
          flags: BOTH_FLAGS,
          expected: 1,
        },
        {
          name: 'generic webhook stays V3 when webhookFormat is absent',
          webhookUrl: GENERIC_URL,
          flags: BOTH_FLAGS,
          expected: 1,
        },
        {
          name: 'treats a zapier webhook as generic (opted in => V4)',
          webhookUrl: ZAPIER_URL,
          webhookFormat: 'v4' as const,
          flags: BOTH_FLAGS,
          expected: 2,
        },
        {
          name: 'treats a zapier webhook as generic (not opted in => V3)',
          webhookUrl: ZAPIER_URL,
          flags: BOTH_FLAGS,
          expected: 1,
        },
      ])('$name', async ({ webhookUrl, webhookFormat, flags, expected }) => {
        const mockReq = await runGate({ webhookUrl, webhookFormat, flags })

        expect(mockReq.formsg.encryptedPayload.mrfVersion).toBe(expected)
        // V4 encrypts the responses as-is; V3 encrypts the adapted (downgraded) shape.
        expect(jest.mocked(formsgSdk.cryptoV3.encrypt)).toHaveBeenCalledWith(
          expected === 2 ? MOCK_RESPONSES : V3_ADAPTED,
          MOCK_FORM_PUBLIC_KEY,
        )
      })

      // Parity invariant: with both flags off the gate reduces exactly to the
      // pre-existing `hasWebhook ? 1 : 2`.
      it('with both flags off, reduces exactly to hasWebhook ? 1 : 2', async () => {
        for (const webhookUrl of [PLUMBER_URL, GENERIC_URL, ZAPIER_URL]) {
          const mockReq = await runGate({ webhookUrl })
          expect(mockReq.formsg.encryptedPayload.mrfVersion).toBe(1)
        }
        // Even a form that has opted into v4 stays V3 while the flags are off.
        for (const webhookUrl of [PLUMBER_URL, GENERIC_URL, ZAPIER_URL]) {
          const mockReq = await runGate({ webhookUrl, webhookFormat: 'v4' })
          expect(mockReq.formsg.encryptedPayload.mrfVersion).toBe(1)
        }
        const noWebhookReq = await runGate({})
        expect(noWebhookReq.formsg.encryptedPayload.mrfVersion).toBe(2)
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

    describe('step-token write-guard', () => {
      const RAW_STEP_TOKEN = stepToken.generate()

      // Build a request whose decrypt-gate will pass (matching the beforeEach
      // mocks), varying only the step-token bits.
      const createGuardReq = ({
        flagOn,
        stepTokenHash,
        presentedToken,
      }: {
        flagOn: boolean
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
        mockReq.growthbook = {
          isOn: jest.fn(
            (flag: string) => flagOn && flag === featureFlags.mrfStepWriteToken,
          ),
        }
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
          flagOn: true,
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
          flagOn: true,
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
          flagOn: true,
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

      it('should advance on a legacy row without a hash even with no token (migration grace)', async () => {
        const mockReq = createGuardReq({
          flagOn: true,
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

      it('should not require a token when the flag is off, even if the row carries a hash (regression)', async () => {
        const mockReq = createGuardReq({
          flagOn: false,
          stepTokenHash: stepToken.hash(RAW_STEP_TOKEN),
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
})
