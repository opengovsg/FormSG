import { ObjectId } from 'bson'
import { errAsync, ok, okAsync } from 'neverthrow'

import { BasicField, FormResponseMode } from '../../../../../../shared/types'
import formsgSdk from '../../../../config/formsg-sdk'
import * as FeatureFlagService from '../../../feature-flags/feature-flags.service'
import * as FormService from '../../../form/form.service'
import { SubmissionNotFoundError } from '../../submission.errors'
import {
  createFormsgAndRetrieveForm,
  encryptSubmission,
} from '../multirespondent-submission.middleware'
import {
  checkFormIsMultirespondent,
  getMultirespondentSubmission,
} from '../multirespondent-submission.service'
import { prepareWebhookResponseContentV3 } from '../multirespondent-submission.utils'

jest.mock('../../../feature-flags/feature-flags.service')
jest.mock('../../../form/form.service')
jest.mock('../multirespondent-submission.service')
jest.mock('../multirespondent-submission.utils')
jest.mock('../../../../config/formsg-sdk')

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
    admin: { _id: new ObjectId() },
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
      { _id: 'snapshot_field2', fieldType: 'email', title: 'Snapshot Field 2' },
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

  const mockNext = jest.fn()

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
      hasRespondentCopy: MOCK_FORM.hasRespondentCopy, // Should use current form data
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

describe('encryptSubmission', () => {
  const MOCK_FORM_ID = new ObjectId().toHexString()
  const MOCK_SUBMISSION_ID = new ObjectId().toHexString()
  const MOCK_PUBLIC_KEY = 'mock-public-key'
  const MOCK_SUBMISSION_PUBLIC_KEY = 'mock-submission-public-key'
  const MOCK_ENCRYPTED_WEBHOOK_CONTENT = 'mock-encrypted-webhook-content'
  const MOCK_WEBHOOK_RESPONSES: ReturnType<
    typeof prepareWebhookResponseContentV3
  > = {
    field1: {
      fieldType: BasicField.ShortText,
      answer: 'test answer',
    },
    field2: {
      fieldType: BasicField.Email,
      answer: {
        value: 'test@example.com',
      },
    },
  }

  const MOCK_FORM_DEF = {
    _id: MOCK_FORM_ID,
    publicKey: MOCK_PUBLIC_KEY,
    title: 'Test Form',
  }

  const MOCK_RESPONSES = {
    field1: {
      fieldType: BasicField.ShortText,
      answer: 'test answer',
    },
    field2: {
      fieldType: BasicField.Email,
      answer: 'test@example.com',
    },
  }

  const MOCK_STRIPPED_ATTACHMENT_RESPONSES = {
    field1: {
      fieldType: BasicField.ShortText,
      answer: 'test answer',
    },
    field2: {
      fieldType: BasicField.Email,
      answer: 'test@example.com',
    },
  }

  const createMockReq = (params: { formId: string; submissionId?: string }) =>
    ({
      params,
      body: {
        responses: MOCK_RESPONSES,
        version: 1,
        workflowStep: 1,
        responseMetadata: {},
      },
      formsg: {
        formDef: MOCK_FORM_DEF,
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
      originalUrl: '/api/v3/forms/mock-form-id/submissions?param=value',
    }) as any

  const createMockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  })

  const mockNext = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()

    // Mock formsgSdk.cryptoV3.encrypt
    jest.mocked(formsgSdk.cryptoV3.encrypt).mockReturnValue({
      encryptedContent: 'mock-encrypted-content',
      encryptedSubmissionSecretKey: 'mock-encrypted-secret-key',
      submissionSecretKey: 'mock-secret-key',
      submissionPublicKey: MOCK_SUBMISSION_PUBLIC_KEY,
    })

    // Mock formsgSdk.crypto.encrypt
    jest
      .mocked(formsgSdk.crypto.encrypt)
      .mockReturnValue(MOCK_ENCRYPTED_WEBHOOK_CONTENT)

    // Mock prepareWebhookResponseContentV3
    jest
      .mocked(prepareWebhookResponseContentV3)
      .mockReturnValue(MOCK_WEBHOOK_RESPONSES)

    // Mock getEncryptedAttachmentsMapFromAttachmentsMap
    jest.doMock('../multirespondent-submission.utils', () => ({
      ...jest.requireActual('../multirespondent-submission.utils'),
      getEncryptedAttachmentsMapFromAttachmentsMap: jest
        .fn()
        .mockResolvedValue({}),
    }))
  })

  it('should include encryptedWebhookContent in req.formsg', async () => {
    const mockReq = createMockReq({
      formId: MOCK_FORM_ID,
      submissionId: MOCK_SUBMISSION_ID,
    })
    const mockRes = createMockRes()

    // Act
    await encryptSubmission(mockReq, mockRes as any, mockNext)

    // Assert
    expect(mockNext).toHaveBeenCalled()
    expect(mockReq.formsg).toHaveProperty('encryptedWebhookContent')
    expect(mockReq.formsg.encryptedWebhookContent).toBe(
      MOCK_ENCRYPTED_WEBHOOK_CONTENT,
    )

    // Verify that prepareWebhookResponseContentV3 was called with correct parameters
    expect(prepareWebhookResponseContentV3).toHaveBeenCalledWith(
      MOCK_STRIPPED_ATTACHMENT_RESPONSES,
    )

    // Verify that formsgSdk.crypto.encrypt was called with correct parameters
    expect(formsgSdk.crypto.encrypt).toHaveBeenCalledWith(
      MOCK_WEBHOOK_RESPONSES,
      MOCK_SUBMISSION_PUBLIC_KEY,
    )
  })
})
