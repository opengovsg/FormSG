import {
  AdminMultirespondentFormDto,
  FormAuthType,
  LogicType,
  WorkflowType,
} from 'formsg-shared/types'
import {
  formUsesAuthType,
  getFieldSourceProvider,
  getStepAuthType,
  getStepFieldsNeedingLogin,
} from 'formsg-shared/utils/step-login'

/** Compute the exact consequences before asking for destructive confirmation. */
export const getAuthSwitchConsequences = (
  form: AdminMultirespondentFormDto,
  stepIndex: number,
  nextAuthType: FormAuthType,
  assignedIds: readonly string[],
) => {
  const workflow = form.workflow.map((step, index) =>
    index === stepIndex
      ? {
          ...step,
          auth:
            nextAuthType === FormAuthType.NIL
              ? undefined
              : {
                  auth_type: nextAuthType as
                    | FormAuthType.MyInfo
                    | FormAuthType.CP,
                },
        }
      : step,
  )
  const nextFormAuth = stepIndex === 0 ? nextAuthType : form.authType
  const authType =
    nextFormAuth === FormAuthType.SP ? FormAuthType.MyInfo : nextFormAuth
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
        {
          authType:
            form.authType === FormAuthType.SP
              ? FormAuthType.MyInfo
              : form.authType,
          workflow,
        },
        provider,
      )
    )
  })
}

export const getWorkflowAuthOptions = (form: AdminMultirespondentFormDto) => {
  const options: {
    authType: FormAuthType.MyInfo | FormAuthType.CP
    esrvcId?: string
  }[] = []
  form.workflow.forEach((step, index) => {
    const savedProvider = getStepAuthType(form, form.workflow, index)
    const provider =
      savedProvider === FormAuthType.SP ? FormAuthType.MyInfo : savedProvider
    if (provider !== FormAuthType.MyInfo && provider !== FormAuthType.CP) return
    const esrvcId =
      provider === FormAuthType.CP
        ? index === 0
          ? (form.esrvcId ?? '')
          : (step.auth?.esrvc_id ?? '')
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
