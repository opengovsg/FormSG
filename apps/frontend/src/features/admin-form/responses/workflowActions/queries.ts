import { useQuery } from 'react-query'

import { getWorkflowEvents } from '../AdminSubmissionsService'
import { adminFormResponsesKeys } from '../queries'

export const workflowEventsKey = (formId: string, submissionId: string) =>
  [
    ...adminFormResponsesKeys.individual(formId, submissionId),
    'workflowEvents',
  ] as const

export const useWorkflowEvents = ({
  formId,
  submissionId,
  enabled,
}: {
  formId: string
  submissionId: string
  enabled: boolean
}) =>
  useQuery(
    workflowEventsKey(formId, submissionId),
    () => getWorkflowEvents({ formId, submissionId }),
    { enabled: enabled && !!formId },
  )
