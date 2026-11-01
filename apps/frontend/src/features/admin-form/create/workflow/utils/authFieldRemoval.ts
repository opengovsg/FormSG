import isEqual from 'lodash/isEqual'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  LogicType,
  StepLoginAuthType,
  WorkflowStepAuthType,
  WorkflowType,
} from 'formsg-shared/types'
import {
  formUsesAuthType,
  getFieldSourceProvider,
  getStepAuthType,
  getStepEsrvcId,
  getStepFieldsNeedingLogin,
  isWorkflowStepAuthType,
} from 'formsg-shared/utils/step-login'

/** Legacy Singpass-only login counts as Singpass. */
export const toStepLoginAuthType = (
  authType: FormAuthType,
): StepLoginAuthType =>
  authType === FormAuthType.SP ? FormAuthType.MyInfo : authType

const REVIEWED_FORM_KEYS = [
  'authType',
  'esrvcId',
  'workflow',
  'form_fields',
  'form_logics',
] as const
type ReviewedForm = Pick<
  AdminMultirespondentFormDto,
  (typeof REVIEWED_FORM_KEYS)[number]
>

/** Whether the form changed since the admin reviewed the fields to delete. */
export const hasReviewedFormChanged = (
  latest: ReviewedForm,
  baseline: ReviewedForm,
): boolean =>
  REVIEWED_FORM_KEYS.some((key) => !isEqual(latest[key], baseline[key]))

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
  const authType = toStepLoginAuthType(
    stepIndex === 0 ? nextAuthType : form.authType,
  )
  const deletedFields = form.form_fields.filter((field) => {
    const provider = getFieldSourceProvider(field)
    return provider && !formUsesAuthType({ authType, workflow }, provider)
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
) => {
  const workflow = form.workflow.filter((_step, index) => index !== stepIndex)
  return form.form_fields.filter((field) => {
    const provider = getFieldSourceProvider(field)
    return (
      provider &&
      !formUsesAuthType(
        { authType: toStepLoginAuthType(form.authType), workflow },
        provider,
      )
    )
  })
}

export const getWorkflowAuthOptions = (form: AdminMultirespondentFormDto) => {
  const options: { authType: WorkflowStepAuthType; esrvcId?: string }[] = []
  form.workflow.forEach((_step, index) => {
    const provider = toStepLoginAuthType(
      getStepAuthType(form, form.workflow, index),
    )
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
