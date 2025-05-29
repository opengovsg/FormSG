import { rest } from 'msw'
import { PartialDeep } from 'type-fest'

import { StatusTrackerData, WorkflowStatus, WorkflowType } from '~shared/types'

const BASE_STATUS_TRACKER_DATA: StatusTrackerData = {
  submittedSteps: [
    {
      isApproval: false,
      submittedAt: '2025-05-26T00:23:43.574Z',
      nextStepRecipientEmails: ['scott@open.gov.sg'],
    },
    {
      submittedAt: '2025-05-26T00:23:57.742Z',
      nextStepRecipientEmails: ['scott@open.gov.sg'],
      status: WorkflowStatus.APPROVED,
      isApproval: true,
    },
  ],
  workflow: [
    {
      _id: '6825459367829851d459dbc4',
      workflow_type: WorkflowType.Static,
      emails: [],
      edit: ['6824431c419499b9130367fa'],
      step_name: 'sdfasdhadh',
    },
    {
      _id: '6825467967829851d459dbd4',
      workflow_type: WorkflowType.Static,
      emails: ['scott@open.gov.sg'],
      edit: ['68244320419499b913036805'],
    },
    {
      _id: '682fe307d29c96acb37efa45',
      workflow_type: WorkflowType.Static,
      emails: ['scott@open.gov.sg'],
      edit: ['682fe2f1d29c96acb37efa32'],
      approval_field: '682fe2f1d29c96acb37efa32',
    },
  ],
  responseId: '61540ece3d4a6e50ac0cc700',
  form: '61540ece3d4a6e50ac0cc6ff',
}

export const getStatusTrackerDataResponse = ({
  delay = 0,
  overrides,
}: {
  delay?: number | 'infinite'
  overrides?: PartialDeep<StatusTrackerData>
} = {}) => {
  return rest.get<StatusTrackerData>(
    '/api/v3/status-tracker/:submissionId',
    (req, res, ctx) => {
      if (delay === 'infinite') {
        return new Promise(() => {}) // simulate infinite delay
      }

      const { submissionId } = req.params

      return res(
        ctx.delay(delay),
        ctx.json({
          ...BASE_STATUS_TRACKER_DATA,
          responseId: submissionId,
          ...overrides,
        }),
      )
    },
  )
}
