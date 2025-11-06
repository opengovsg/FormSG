import { ObjectId } from 'bson'
import { errAsync, ok, okAsync } from 'neverthrow'

import formsgSdk from 'src/app/config/formsg-sdk'
import { MyInfoService } from 'src/app/modules/myinfo/myinfo.service'
import * as MyInfoUtil from 'src/app/modules/myinfo/myinfo.util'
import * as OidcService from 'src/app/modules/spcp/spcp.oidc.service'
import * as SpcpUtil from 'src/app/modules/spcp/spcp.util'
import * as VerifiedContentService from 'src/app/modules/verified-content/verified-content.service'

import {
  BasicField,
  FormAuthType,
  FormResponseMode,
} from '../../../../../../shared/types'
import * as FeatureFlagService from '../../../feature-flags/feature-flags.service'
import * as FormService from '../../../form/form.service'
import { SubmissionNotFoundError } from '../../submission.errors'
import {
  createFormsgAndRetrieveForm,
  handleNdiResponses,
} from '../multirespondent-submission.middleware'
import {
  checkFormIsMultirespondent,
  getMultirespondentSubmission,
} from '../multirespondent-submission.service'

jest.mock('../../../feature-flags/feature-flags.service')
jest.mock('../../../form/form.service')
jest.mock('../multirespondent-submission.service')
jest.mock('../../../spcp/spcp.oidc.service')
jest.mock('../../../myinfo/myinfo.service')
jest.mock('../../../verified-content/verified-content.service')
jest.mock('src/app/modules/myinfo/myinfo.util')
jest.mock('src/app/modules/spcp/spcp.util')
jest.mock('src/app/config/formsg-sdk', () => ({
  __esModule: true,
  default: {
    cryptoV3: {
      decryptFromSubmissionKey: jest.fn(),
    },
  },
}))

describe('Multirespondent Submission Middleware', () => {
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
        .mockReturnValue(ok('verified-content'))

      const mockDecryptFromSubmissionKey = formsgSdk.cryptoV3
        .decryptFromSubmissionKey as jest.Mock

      mockDecryptFromSubmissionKey.mockReturnValue({
        verified: {},
        submissionSecretKey: '',
        responses: {},
      })

      jest.mocked(SpcpUtil.createNdiResponsesV3FromRecord).mockReturnValue({
        'SingPass Validated NRIC (Step 1)': {
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

      // Act
      await handleNdiResponses(mockReq, mockRes as any, mockNext)

      // Assert
      expect(
        jest.mocked(SpcpUtil.createNdiResponsesV3FromRecord),
      ).toHaveBeenCalled()
      expect(mockReq.formsg.encryptedPayload.responses).toHaveProperty(
        'SingPass Validated NRIC (Step 1)',
      )
      expect(
        jest.mocked(VerifiedContentService.getVerifiedContent),
      ).toHaveBeenCalled()
      expect(
        jest.mocked(formsgSdk.cryptoV3.decryptFromSubmissionKey),
      ).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
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

      jest.mocked(SpcpUtil.createNdiResponsesV3FromRecord).mockReturnValue({
        'SingPass Validated NRIC (Step 1)': {
          fieldType: BasicField.Nric,
          answer: 'S1234567A',
        },
      })

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
        'SingPass Validated NRIC (Step 1)',
      )
    })
  })
})
