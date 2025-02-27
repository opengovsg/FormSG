import { WorkflowStatus } from '~shared/types'

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
          expect.not.objectContaining({ question: MRF_REMINDERS_LABEL }),
        ])
      })
    })
  })
})
