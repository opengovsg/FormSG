import { delay as MswDelay, http, HttpResponse } from 'msw'
import { PartialDeep } from 'type-fest'

import { StatusTrackerData, WorkflowStatus, WorkflowType } from '~shared/types'

const BASE_STATUS_TRACKER_DATA: StatusTrackerData = {
  submittedSteps: [
    {
      isApproval: false,
      submittedAt: '2025-05-26T00:23:43.574Z',
    },
    {
      submittedAt: '2025-05-26T00:23:57.742Z',
      status: WorkflowStatus.APPROVED,
      isApproval: true,
    },
  ],
  workflow: [
    {
      _id: '6825459367829851d459dbc4',
      workflow_type: WorkflowType.Static,
      edit: ['6824431c419499b9130367fa'],
      step_name: 'sdfasdhadh',
    },
    {
      _id: '6825467967829851d459dbd4',
      workflow_type: WorkflowType.Static,
      edit: ['68244320419499b913036805'],
    },
    {
      _id: '682fe307d29c96acb37efa45',
      workflow_type: WorkflowType.Static,
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
  return http.get<{ submissionId: string }, never, StatusTrackerData>(
    '/api/v3/status/:submissionId',
    async ({ params }) => {
      if (delay === 'infinite') {
        await MswDelay('infinite')
        return new HttpResponse()
      }

      const { submissionId } = params
      await MswDelay(delay)
      return HttpResponse.json({
        ...BASE_STATUS_TRACKER_DATA,
        responseId: submissionId,
        ...overrides,
      })
    },
  )
}
