import { PropsWithChildren } from 'react'
import { screen } from '@testing-library/react'

import {
  BasicField,
  FormResponseMode,
  PaymentStatus,
  SubmissionMrfMetadata,
  SubmissionPaymentDto,
  WorkflowStatus,
} from 'formsg-shared/types'

import { isMaskedInDatadogReplay, render } from '~/test-utils'

import { MRF_STATUS } from '../common/utils/mrfSubmissionView'
import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '../constants'
import { AugmentedDecryptedResponse } from '../ResponsesPage/storage/utils/augmentDecryptedResponses'

import { IndividualResponsePage } from './IndividualResponsePage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  Trans: ({ children }: PropsWithChildren) => children,
}))

vi.mock('react-router-dom', () => ({
  useParams: () => ({
    formId: 'mock-form-id',
    submissionId: 'mock-submission-id',
  }),
}))

let mockResponseMode: FormResponseMode = FormResponseMode.Encrypt

vi.mock('~features/admin-form/common/queries', () => ({
  useAdminForm: () => ({
    data: {
      _id: 'mock-form-id',
      responseMode: mockResponseMode,
      workflow: [{ _id: 'mock-step-id' }],
    },
  }),
}))

vi.mock('~features/user/queries', () => ({
  useUser: () => ({ user: undefined }),
}))

vi.mock('../ResponsesPage/storage', () => ({
  useStorageResponsesContext: () => ({ secretKey: 'mock-secret-key' }),
}))

let mockIsWorkflowActionsOn = false

vi.mock('../workflowActions', () => ({
  useWorkflowActionsGate: () => mockIsWorkflowActionsOn,
}))

vi.mock('./mutations', () => ({
  useMutateDownloadAttachments: () => ({
    downloadAttachmentMutation: { mutate: vi.fn(), isLoading: false },
    downloadAttachmentsAsZipMutation: { mutate: vi.fn(), isLoading: false },
  }),
}))

const MOCK_DECRYPTED_ANSWER = 'mock decrypted answer text'
const MOCK_ATTACHMENT_FILENAME = 'mock-attachment.pdf'

const MOCK_RESPONSES: AugmentedDecryptedResponse[] = [
  {
    _id: 'field-1',
    fieldType: BasicField.ShortText,
    question: 'What is your name?',
    questionNumber: 1,
    answer: MOCK_DECRYPTED_ANSWER,
  },
  {
    _id: 'field-2',
    fieldType: BasicField.Attachment,
    question: 'Upload a document',
    questionNumber: 2,
    answer: MOCK_ATTACHMENT_FILENAME,
    downloadUrl: 'https://example.com/mock-download-url',
  },
] as AugmentedDecryptedResponse[]

const MOCK_PAYER_EMAIL = 'mock-payer@example.com'

const MOCK_PAYMENT: SubmissionPaymentDto = {
  id: 'mock-payment-id',
  paymentIntentId: 'mock-payment-intent-id',
  email: MOCK_PAYER_EMAIL,
  amount: 1000,
  status: PaymentStatus.Succeeded,
  paymentDate: 'Mon, 6 Jul 2026, 12:00:00 pm',
  transactionFee: 50,
  receiptUrl: 'https://example.com/mock-receipt-url',
}

let mockMrf: SubmissionMrfMetadata = undefined

vi.mock('./queries', () => ({
  useIndividualSubmission: () => ({
    data: {
      refNo: 'mock-submission-id',
      submissionTime: 'Mon, 6 Jul 2026, 12:00:00 pm',
      responses: MOCK_RESPONSES,
      payment: MOCK_PAYMENT,
      mrf: mockMrf,
    },
    isLoading: false,
    isError: false,
  }),
}))

describe('IndividualResponsePage', () => {
  afterEach(() => {
    mockResponseMode = FormResponseMode.Encrypt
    mockIsWorkflowActionsOn = false
    mockMrf = undefined
  })

  it('shows the payment section for a pre-migration encrypt submission on a multirespondent form', () => {
    // A mode-migrated multirespondent form holds pre-migration encrypt
    // submissions; one with a completed payment decrypts to data with a
    // payment and no mrf metadata or submission secret key.
    mockResponseMode = FormResponseMode.Multirespondent

    render(<IndividualResponsePage />)

    // Payment details render presence-based, independent of response mode.
    expect(screen.getByText(MOCK_PAYER_EMAIL)).toBeInTheDocument()
    // The MRF chrome still renders (with an empty workflow) alongside the
    // payment section.
    expect(
      screen.getByText(`${MRF_WORKFLOW_STATUS_LABEL}:`),
    ).toBeInTheDocument()
    expect(
      screen.getByText(`${MRF_PENDING_RESPONSE_AT_LABEL}:`),
    ).toBeInTheDocument()
  })

  it('masks decrypted answers, attachment names and payment details in session replays', () => {
    render(<IndividualResponsePage />)

    const answer = screen.getByText(MOCK_DECRYPTED_ANSWER)
    expect(isMaskedInDatadogReplay(answer)).toBe(true)

    const attachmentName = screen.getByText(MOCK_ATTACHMENT_FILENAME)
    expect(isMaskedInDatadogReplay(attachmentName)).toBe(true)

    const payerEmail = screen.getByText(MOCK_PAYER_EMAIL)
    expect(isMaskedInDatadogReplay(payerEmail)).toBe(true)
  })

  it('shows the status tracking link as its URL without workflow actions', () => {
    mockResponseMode = FormResponseMode.Multirespondent

    render(<IndividualResponsePage />)

    expect(
      screen.getByRole('link', {
        name: /\/mock-form-id\/status\/mock-submission-id/,
      }),
    ).toBeInTheDocument()
  })

  it('shows the status tracking link as "View" with workflow actions', () => {
    mockResponseMode = FormResponseMode.Multirespondent
    mockIsWorkflowActionsOn = true

    render(<IndividualResponsePage />)

    expect(
      screen.getByRole('link', {
        name: 'features.adminForm.responses.individualResponse.statusTrackingLinkLabel',
      }),
    ).toHaveAttribute(
      'title',
      expect.stringContaining('/mock-form-id/status/mock-submission-id'),
    )
  })

  describe('a stopped workflow', () => {
    beforeEach(() => {
      mockResponseMode = FormResponseMode.Multirespondent
      mockMrf = {
        workflowStatus: WorkflowStatus.PENDING,
        workflowCurrentStepNumber: 1,
        workflowNumTotalSteps: 2,
        lastSubmittedAt: undefined,
        hasNextStepRecipientEmails: true,
        isWorkflowActionsEligible: true,
        stoppedAt: '2026-10-07T08:00:00.000Z',
      }
    })

    it('shows Stopped and no pending step with workflow actions', () => {
      mockIsWorkflowActionsOn = true

      render(<IndividualResponsePage />)

      expect(screen.getByText(MRF_STATUS.STOPPED)).toBeInTheDocument()
      expect(screen.queryByText(MRF_STATUS.PENDING)).not.toBeInTheDocument()
    })

    it('shows Pending without workflow actions', () => {
      render(<IndividualResponsePage />)

      expect(screen.getByText(MRF_STATUS.PENDING)).toBeInTheDocument()
      expect(screen.queryByText(MRF_STATUS.STOPPED)).not.toBeInTheDocument()
    })
  })
})
