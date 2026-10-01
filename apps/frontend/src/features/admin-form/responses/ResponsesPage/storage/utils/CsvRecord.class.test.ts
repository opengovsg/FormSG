import {
  PaymentStatus,
  SubmissionPaymentDto,
  WorkflowStatus,
} from 'formsg-shared/types'

import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_REMINDERS_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '~features/admin-form/responses/constants'

import { CsvRecordStatus } from '../types'

import { CsvRecord } from './CsvRecord.class'

describe('CsvRecord', () => {
  describe('materializeSubmissionData', () => {
    describe('when mrfData is defined ', () => {
      it('should output mrf data in specfic order', () => {
        // Arrange
        const record = new CsvRecord(
          'mockId',
          '2025-02-17T00:00:00.000Z',
          CsvRecordStatus.Ok,
          'mockFormId',
          'mockHostOrigin',
          undefined,
          {
            workflowStatus: WorkflowStatus.PENDING,
            workflowCurrentStepNumber: 1,
            workflowNumTotalSteps: 2,
            lastSubmittedAt: '2025-02-17T00:00:00.000Z',
            hasNextStepRecipientEmails: false,
          },
        )

        // Act
        record.materializeSubmissionData()

        // Assert
        const { record: recordResult } = record.submissionData!
        expect(recordResult).toEqual([
          expect.objectContaining({ question: 'Download Status' }),
          expect.objectContaining({ question: MRF_WORKFLOW_STATUS_LABEL }),
          expect.objectContaining({ question: MRF_PENDING_RESPONSE_AT_LABEL }),
        ])
        expect(recordResult).not.toContainEqual(
          expect.objectContaining({ question: MRF_REMINDERS_LABEL }),
        )
      })
    })

    describe('when paymentData is defined and mrfData is undefined', () => {
      it('should output payment columns and no mrf columns for a pre-migration encrypt row', () => {
        // Arrange
        // A pre-migration encrypt submission with a completed payment on a
        // mode-migrated multirespondent form: the worker constructs its
        // CsvRecord with payment data and no mrf data.
        const mockPayment: SubmissionPaymentDto = {
          id: 'mockPaymentId',
          paymentIntentId: 'pi_MOCK_PAYMENT_INTENT_ID',
          email: 'payer@example.com',
          amount: 3141,
          status: PaymentStatus.Succeeded,
          paymentDate: 'Thu, 6 Apr 2023, 04:39:22 PM',
          transactionFee: 600,
          receiptUrl: 'https://some.random.url.example.com',
        }
        const record = new CsvRecord(
          'mockId',
          '2025-02-17T00:00:00.000Z',
          CsvRecordStatus.Ok,
          'mockFormId',
          'https://mock.host.origin',
          mockPayment,
          undefined,
        )

        // Act
        record.materializeSubmissionData()

        // Assert
        const { record: recordResult } = record.submissionData!
        expect(recordResult[0]).toEqual(
          expect.objectContaining({ question: 'Download Status' }),
        )
        expect(recordResult).toContainEqual(
          expect.objectContaining({
            question: 'Payment status',
            answer: 'Succeeded',
          }),
        )
        expect(recordResult).toContainEqual(
          expect.objectContaining({
            question: 'Payer',
            answer: mockPayment.email,
          }),
        )
        expect(recordResult).toContainEqual(
          expect.objectContaining({
            question: 'Payment amount',
            answer: 'S$31.41',
          }),
        )
        expect(recordResult).not.toContainEqual(
          expect.objectContaining({ question: MRF_WORKFLOW_STATUS_LABEL }),
        )
        expect(recordResult).not.toContainEqual(
          expect.objectContaining({ question: MRF_PENDING_RESPONSE_AT_LABEL }),
        )
      })
    })
  })
})
