import { PropsWithChildren, ReactNode } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  BasicField,
  FormResponseMode,
  PaymentStatus,
  SubmissionMrfMetadata,
  SubmissionPaymentDto,
  WorkflowStatus,
} from 'formsg-shared/types'

import { isMaskedInDatadogReplay, render } from '~/test-utils'

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

let mockSubmissionId = 'mock-submission-id'

vi.mock('react-router-dom', () => ({
  useParams: () => ({
    formId: 'mock-form-id',
    submissionId: mockSubmissionId,
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
  WorkflowActionsSection: ({ overview }: { overview?: ReactNode }) => (
    <>{overview}</>
  ),
  WorkflowActivityLog: () => <div>Workflow history content</div>,
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
let mockPayment: SubmissionPaymentDto | undefined = MOCK_PAYMENT

vi.mock('./queries', () => ({
  useIndividualSubmission: () => ({
    data: {
      refNo: 'mock-submission-id',
      submissionTime: 'Mon, 6 Jul 2026, 12:00:00 pm',
      responses: MOCK_RESPONSES,
      payment: mockPayment,
      mrf: mockMrf,
    },
    isLoading: false,
    isError: false,
  }),
}))

describe('IndividualResponsePage', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
  })
  afterAll(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
  })
  afterEach(() => {
    mockResponseMode = FormResponseMode.Encrypt
    mockSubmissionId = 'mock-submission-id'
    mockIsWorkflowActionsOn = false
    mockMrf = undefined
    mockPayment = MOCK_PAYMENT
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
    expect(screen.getByText(MRF_WORKFLOW_STATUS_LABEL)).toBeInTheDocument()
    expect(screen.getByText(MRF_PENDING_RESPONSE_AT_LABEL)).toBeInTheDocument()
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

  it('shows tabs only for workflow responses with Activity enabled', () => {
    const { rerender } = render(<IndividualResponsePage />)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    mockResponseMode = FormResponseMode.Multirespondent
    rerender(<IndividualResponsePage />)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    mockIsWorkflowActionsOn = true
    rerender(<IndividualResponsePage />)
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('preserves scroll on tab changes and resets it for a different response', async () => {
    mockResponseMode = FormResponseMode.Multirespondent
    mockIsWorkflowActionsOn = true
    const { rerender } = render(
      <div data-testid="scroll" style={{ overflowY: 'auto' }}>
        <IndividualResponsePage />
      </div>,
    )
    const scroller = screen.getByTestId('scroll')
    scroller.scrollTop = 300
    await userEvent.click(screen.getAllByRole('tab')[1])
    expect(screen.getByText('Workflow history content')).toBeVisible()
    expect(scroller.scrollTop).toBe(300)
    rerender(
      <div data-testid="scroll" style={{ overflowY: 'auto' }}>
        <IndividualResponsePage />
      </div>,
    )
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
      'aria-selected',
      'true',
    )
    scroller.scrollTop = 200
    mockSubmissionId = 'another-submission'
    rerender(
      <div data-testid="scroll" style={{ overflowY: 'auto' }}>
        <IndividualResponsePage />
      </div>,
    )
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(scroller.scrollTop).toBe(0)
    expect(screen.getByText(MOCK_DECRYPTED_ANSWER)).toBeVisible()
  })

  describe('a stopped workflow', () => {
    beforeEach(() => {
      mockResponseMode = FormResponseMode.Multirespondent
      mockPayment = undefined
      mockMrf = {
        workflowStatus: WorkflowStatus.PENDING,
        workflowCurrentStepNumber: 1,
        workflowNumTotalSteps: 2,
        lastSubmittedAt: undefined,
        hasNextStepRecipientEmails: true,
        stoppedAt: '2026-10-07T08:00:00.000Z',
      }
    })

    it('shows Stopped and no pending step with workflow actions', () => {
      mockIsWorkflowActionsOn = true

      render(<IndividualResponsePage />)

      expect(screen.getByText('features.common.stopped')).toBeInTheDocument()
      expect(
        screen.queryByText('features.common.pending'),
      ).not.toBeInTheDocument()
    })

    it('shows Pending without workflow actions', () => {
      render(<IndividualResponsePage />)

      expect(screen.getByText('features.common.pending')).toBeInTheDocument()
      expect(
        screen.queryByText('features.common.stopped'),
      ).not.toBeInTheDocument()
    })
  })
})
