import type { FieldResponsesV4 } from '@opengovsg/formsg-sdk'
import { adaptV4ToV3 } from '@opengovsg/formsg-sdk/adapters'
import {
  FieldResponsesV3,
  FormDto,
  FormWorkflowStep,
  WorkflowType,
} from 'formsg-shared/types'
import { err, ok, Result } from 'neverthrow'

import { getVisibleFieldIdsV3 } from '../../../utils/logic-adaptor'
import { isFieldResponseV4Equal } from '../../../utils/response-v4'
import {
  MrfFixChangesWorkflowPathError,
  ProcessingError,
} from '../submission.errors'

export const isFixingStep = ({
  workflowStep,
  submittedSteps,
}: {
  workflowStep: number
  submittedSteps?: unknown[]
}): boolean => workflowStep < (submittedSteps?.length ?? 0) - 1

const getRoutingFieldIds = (
  workflow: FormWorkflowStep[],
  workflowStep: number,
) =>
  [
    workflow[workflowStep]?.approval_field,
    ...workflow
      .slice(workflowStep + 1)
      .map((step) =>
        step.workflow_type === WorkflowType.Dynamic
          ? step.field
          : step.workflow_type === WorkflowType.Conditional
            ? step.conditional_field
            : undefined,
      ),
  ]
    .filter((fieldId): fieldId is string => !!fieldId)
    .map(String)

const isSameResponse = (
  previous?: FieldResponsesV4[string],
  incoming?: FieldResponsesV4[string],
) =>
  !previous || !incoming
    ? previous === incoming
    : isFieldResponseV4Equal(previous, incoming)

export const checkFixKeepsWorkflowPath = ({
  form,
  workflowStep,
  previousResponses,
  responses,
}: {
  form: Pick<FormDto, '_id' | 'form_fields' | 'form_logics'> & {
    workflow?: unknown[]
  }
  workflowStep: number
  previousResponses: FieldResponsesV4
  responses: FieldResponsesV4
}): Result<void, MrfFixChangesWorkflowPathError | ProcessingError> => {
  const workflow = (form.workflow ?? []) as FormWorkflowStep[]
  const changesRouting = getRoutingFieldIds(workflow, workflowStep).some(
    (fieldId) =>
      !isSameResponse(previousResponses[fieldId], responses[fieldId]),
  )
  if (changesRouting) return err(new MrfFixChangesWorkflowPathError())

  const fixedFieldIds = new Set(
    (workflow[workflowStep]?.edit ?? []).map(String),
  )
  const visibleFieldIds = (fieldResponses: FieldResponsesV4) =>
    getVisibleFieldIdsV3(
      adaptV4ToV3(fieldResponses) as unknown as FieldResponsesV3,
      form,
    )
  return Result.combine([
    visibleFieldIds(previousResponses),
    visibleFieldIds(responses),
  ]).andThen(([before, after]) => {
    const changesVisibility = form.form_fields
      .map(({ _id }) => String(_id))
      .some(
        (fieldId) =>
          !fixedFieldIds.has(fieldId) &&
          before.has(fieldId) !== after.has(fieldId),
      )
    return changesVisibility
      ? err(new MrfFixChangesWorkflowPathError())
      : ok(undefined)
  })
}
