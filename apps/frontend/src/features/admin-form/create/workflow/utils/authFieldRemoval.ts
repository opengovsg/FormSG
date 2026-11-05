import {
  AdminMultirespondentFormDto,
  FormAuthType,
  LogicType,
  StepLoginAuthType,
  WorkflowStepAuthType,
  WorkflowType,
} from 'formsg-shared/types'
import {
  getFieldsWithoutProvider,
  getStepAuthType,
  getStepEsrvcId,
  getStepFieldsNeedingLogin,
  isWorkflowStepAuthType,
} from 'formsg-shared/utils/step-login'

/** Compute the exact consequences before asking for destructive confirmation. */
export const getAuthSwitchConsequences = (
  form: AdminMultirespondentFormDto,
  stepIndex: number,
  nextAuthType: StepLoginAuthType,
  assignedIds: readonly string[],
) => {
  const workflow = form.workflow.map((step, index) =>
    index === stepIndex
      ? {
          ...step,
          auth:
            nextAuthType === FormAuthType.NIL
              ? undefined
              : { auth_type: nextAuthType },
        }
      : step,
  )
  const deletedFields = getFieldsWithoutProvider(form.form_fields, {
    authType: stepIndex === 0 ? nextAuthType : form.authType,
    workflow,
  })
  const unassignedFields = getStepFieldsNeedingLogin(
    form.form_fields.filter((field) => assignedIds.includes(field._id)),
    nextAuthType,
  )
  return { deletedFields, unassignedFields }
}

export const getRemovedStepAuthFields = (
  form: AdminMultirespondentFormDto,
  stepIndex: number,
) =>
  getFieldsWithoutProvider(form.form_fields, {
    authType: form.authType,
    workflow: form.workflow.filter((_step, index) => index !== stepIndex),
  })

export const getWorkflowAuthOptions = (form: AdminMultirespondentFormDto) => {
  const options: { authType: WorkflowStepAuthType; esrvcId?: string }[] = []
  form.workflow.forEach((_step, index) => {
    const provider = getStepAuthType(form, form.workflow, index)
    if (!isWorkflowStepAuthType(provider)) return
    const esrvcId =
      provider === FormAuthType.CP
        ? (getStepEsrvcId(form, form.workflow, index) ?? '')
        : undefined
    if (
      !options.some(
        (option) => option.authType === provider && option.esrvcId === esrvcId,
      )
    ) {
      options.push({ authType: provider, esrvcId })
    }
  })
  return options
}

/** Human-readable references affected by removal. Historical responses are excluded. */
export const getAffectedAuthFieldRules = (
  form: AdminMultirespondentFormDto,
  fieldIds: readonly string[],
): string[] => {
  const removed = new Set(fieldIds)
  const rules: string[] = []
  form.form_logics?.forEach((logic, index) => {
    if (
      logic.conditions.some((condition) => removed.has(condition.field)) ||
      (logic.logicType === LogicType.ShowFields &&
        logic.show.some((id) => removed.has(id)))
    )
      rules.push(`Logic rule ${index + 1}`)
  })
  form.workflow.forEach((step, index) => {
    if (
      (step.workflow_type === WorkflowType.Dynamic &&
        removed.has(step.field)) ||
      (step.workflow_type === WorkflowType.Conditional &&
        removed.has(step.conditional_field))
    )
      rules.push(`Step ${index + 1}: respondent routing`)
    if (step.approval_field && removed.has(step.approval_field))
      rules.push(`Step ${index + 1}: approval field`)
  })
  return rules
}
