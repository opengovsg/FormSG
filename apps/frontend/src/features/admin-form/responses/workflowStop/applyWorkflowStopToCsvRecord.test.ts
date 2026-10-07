import { BasicField, WorkflowStatus } from 'formsg-shared/types'

import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '../constants'
import { DecryptedSubmissionData } from '../ResponsesPage/storage/types'

import { applyWorkflowStopToCsvRecord } from './applyWorkflowStopToCsvRecord'
import { stopWorkflowPreview } from './previewStore'

const buildRow = (submissionId: string): DecryptedSubmissionData => ({
  created: '2026-10-07T00:17:08.000Z',
  submissionId,
  mrfMeta: {
    workflowStatus: WorkflowStatus.PENDING,
    workflowCurrentStepNumber: 1,
    workflowNumTotalSteps: 3,
    lastSubmittedAt: undefined,
    hasNextStepRecipientEmails: true,
  },
  record: [
    {
      _id: 'status',
      fieldType: BasicField.ShortText,
      question: MRF_WORKFLOW_STATUS_LABEL,
      answer: 'Pending',
    },
    {
      _id: 'pendingAt',
      fieldType: BasicField.ShortText,
      question: MRF_PENDING_RESPONSE_AT_LABEL,
      answer: 'Step 2 of 3',
    },
    {
      _id: 'email',
      fieldType: BasicField.Email,
      question: 'Email',
      answer: 'a@b.gov.sg',
    },
  ],
})

describe('applyWorkflowStopToCsvRecord', () => {
  beforeEach(() => window.localStorage.clear())

  it('marks a stopped submission as Stopped with no pending step', () => {
    stopWorkflowPreview('stopped-id', {
      stoppedAt: '2026-10-07T01:00:00.000Z',
      stoppedBy: 'admin@open.gov.sg',
      notifiedEmails: [],
    })

    const { record } = applyWorkflowStopToCsvRecord(buildRow('stopped-id'))

    expect(record.map((c) => 'answer' in c && c.answer)).toEqual([
      'Stopped',
      '-',
      'a@b.gov.sg',
    ])
  })

  it('leaves a submission that was not stopped unchanged', () => {
    const row = buildRow('pending-id')
    expect(applyWorkflowStopToCsvRecord(row)).toBe(row)
  })
})
