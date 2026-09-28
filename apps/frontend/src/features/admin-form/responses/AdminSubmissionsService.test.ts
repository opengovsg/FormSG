import {
  PaymentStatus,
  SubmissionPaymentDto,
  SubmissionType,
} from 'formsg-shared/types'

import formsgSdk from '~utils/formSdk'
import { ApiService } from '~services/ApiService'

import { getDecryptedSubmissionById } from './AdminSubmissionsService'

vi.mock('~services/ApiService', () => ({
  ApiService: { get: vi.fn() },
}))

vi.mock('~utils/formSdk', () => ({
  default: {
    crypto: { decrypt: vi.fn() },
    cryptoV3: { decryptToV4: vi.fn() },
  },
}))

vi.mock('./common/utils/decryptionWorker', () => ({
  killWorkers: vi.fn(),
  makeWorkerApiAndCleanup: vi.fn(),
}))

vi.mock('./ResponsesPage/storage/StorageResponsesService', () => ({
  getEncryptedResponsesStream: vi.fn(),
}))

vi.mock('./ResponsesPage/storage/utils/augmentDecryptedResponses', () => ({
  augmentDecryptedResponses: (content: unknown) => content,
}))

vi.mock('./ResponsesPage/storage/utils/processDecryptedContent', () => ({
  buildFormFieldMetaMap: vi.fn().mockReturnValue({}),
  processDecryptedContent: vi.fn().mockReturnValue([]),
  processDecryptedContentV4: vi.fn().mockReturnValue([]),
}))

const MOCK_PAYMENT: SubmissionPaymentDto = {
  id: 'mock-payment-id',
  paymentIntentId: 'mock-payment-intent-id',
  email: 'mock-payer@example.com',
  amount: 1000,
  status: PaymentStatus.Succeeded,
  paymentDate: 'Mon, 6 Jul 2026, 12:00:00 pm',
  transactionFee: 50,
  receiptUrl: 'https://example.com/mock-receipt-url',
}

describe('getDecryptedSubmissionById', () => {
  it('preserves payment data for multirespondent submissions', async () => {
    vi.mocked(ApiService.get).mockResolvedValueOnce({
      data: {
        submissionType: SubmissionType.Multirespondent,
        refNo: 'mock-submission-id',
        submissionTime: 'Mon, 6 Jul 2026, 12:00:00 pm',
        form_fields: [],
        form_logics: [],
        encryptedContent: 'mock-encrypted-content',
        encryptedSubmissionSecretKey: 'mock-encrypted-sub-key',
        attachmentMetadata: {},
        version: 3,
        mrfVersion: 1,
        payment: MOCK_PAYMENT,
      },
    })
    vi.mocked(formsgSdk.cryptoV3.decryptToV4).mockReturnValueOnce({
      responses: {},
      submissionSecretKey: 'mock-submission-secret-key',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const result = await getDecryptedSubmissionById({
      formId: 'mock-form-id',
      submissionId: 'mock-submission-id',
      secretKey: 'mock-secret-key',
    })

    expect(result?.payment).toEqual(MOCK_PAYMENT)
  })
})
