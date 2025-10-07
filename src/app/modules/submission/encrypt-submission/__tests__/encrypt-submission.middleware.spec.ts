import { ObjectId } from 'bson'

import { BasicField } from '../../../../../../shared/types'
import formsgSdk from '../../../../config/formsg-sdk'
import { getEncryptedAttachmentsMapFromAttachmentsMap } from '../../submission.utils'
import { encryptSubmission } from '../encrypt-submission.middleware'
import { prepareWebhookResponseContent } from '../encrypt-submission.utils'

jest.mock('../encrypt-submission.utils', () => ({
  ...jest.requireActual('../encrypt-submission.utils'),
  prepareWebhookResponseContent: jest.fn(),
}))
jest.mock('../../../../config/formsg-sdk')
jest.mock('../../submission.utils')

describe('encryptSubmission', () => {
  const MOCK_FORM_ID = new ObjectId().toHexString()
  const MOCK_PUBLIC_KEY = 'mock-public-key'
  const MOCK_ENCRYPTED_WEBHOOK_CONTENT = 'mock-encrypted-webhook-content'
  const MOCK_WEBHOOK_RESPONSES: ReturnType<
    typeof prepareWebhookResponseContent
  > = [
    {
      fieldType: BasicField.ShortText,
      answer: 'test answer',
      _id: 'field1',
      question: 'Test Question 1',
    },
    {
      fieldType: BasicField.Email,
      answer: 'test@example.com',
      _id: 'field2',
      question: 'Test Question 2',
    },
  ]

  const MOCK_ENCRYPTED_FORM_DEF = {
    _id: MOCK_FORM_ID,
    publicKey: MOCK_PUBLIC_KEY,
    title: 'Test Form',
  }

  const MOCK_RESPONSES = [
    {
      fieldType: BasicField.ShortText,
      answer: 'test answer',
      _id: 'field1',
      question: 'Test Question 1',
      isVisible: true,
    },
    {
      fieldType: BasicField.Email,
      answer: 'test@example.com',
      _id: 'field2',
      question: 'Test Question 2',
      isVisible: true,
    },
  ]

  const MOCK_STRIPPED_BODY_RESPONSES = [
    {
      fieldType: BasicField.ShortText,
      answer: 'test answer',
      _id: 'field1',
      question: 'Test Question 1',
      // isVisible property should be removed by omitResponseKeys
    },
    {
      fieldType: BasicField.Email,
      answer: 'test@example.com',
      _id: 'field2',
      question: 'Test Question 2',
      // isVisible property should be removed by omitResponseKeys
    },
  ]

  const createMockReq = (params: { formId: string }) =>
    ({
      params,
      body: {
        responses: MOCK_RESPONSES,
        version: 1,
      },
      formsg: {
        encryptedFormDef: MOCK_ENCRYPTED_FORM_DEF,
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

    // Mock formsgSdk.crypto.encrypt
    jest
      .mocked(formsgSdk.crypto.encrypt)
      .mockReturnValue(MOCK_ENCRYPTED_WEBHOOK_CONTENT)

    // Mock prepareWebhookResponseContent
    jest
      .mocked(prepareWebhookResponseContent)
      .mockReturnValue(MOCK_WEBHOOK_RESPONSES)

    // Mock getEncryptedAttachmentsMapFromAttachmentsMap
    jest
      .mocked(getEncryptedAttachmentsMapFromAttachmentsMap)
      .mockResolvedValue({})
  })

  it('should include encryptedWebhookContent in req.formsg', async () => {
    const mockReq = createMockReq({
      formId: MOCK_FORM_ID,
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

    // Verify that prepareWebhookResponseContent was called with correct parameters
    expect(prepareWebhookResponseContent).toHaveBeenCalledWith(
      MOCK_STRIPPED_BODY_RESPONSES,
    )

    // Verify that formsgSdk.crypto.encrypt was called with correct parameters
    expect(formsgSdk.crypto.encrypt).toHaveBeenCalledWith(
      MOCK_WEBHOOK_RESPONSES,
      MOCK_PUBLIC_KEY,
    )
  })
})
