import {
  DeleteWorkflowAuthDto,
  FormAuthType,
  FormStatus,
  FormWorkflowDto,
  LogicType,
  WorkflowType,
} from 'formsg-shared/types'
import {
  getFieldsWithoutProvider,
  getStepAuthType,
  getStepEsrvcId,
  isWorkflowStepAuthType,
} from 'formsg-shared/utils/step-login'
import { err, ok } from 'neverthrow'

import {
  FormLogicSchema,
  IPopulatedForm,
  IPopulatedMultirespondentForm,
} from '../../../../types'
import { MalformedParametersError } from '../../core/core.errors'
import { FormOpenToResponsesError } from '../form.errors'

import { FormChangedWhileEditingError } from './admin-form.errors'

const toPlain = <T>(value: T): T => {
  const document = value as T & { toObject?: () => T }
  return typeof document.toObject === 'function' ? document.toObject() : value
}

/**
 * Deletes the login fields no step can fill once `workflow` and `authType`
 * are saved. The admin confirms the exact fields against the form version
 * they reviewed, so the request never names arbitrary fields to delete.
 */
export const prepareAuthFieldDeletion = ({
  form,
  workflow,
  authType,
  confirmedIds = [],
  expectedLastModified,
}: {
  form: IPopulatedForm
  workflow: FormWorkflowDto
  authType: FormAuthType
  confirmedIds?: string[]
  expectedLastModified?: string
}) => {
  const ids = getFieldsWithoutProvider(form.form_fields, {
    authType,
    workflow,
  }).map((field) => String(field._id))
  if (
    ids.length !== confirmedIds.length ||
    ids.some((id) => !confirmedIds.includes(id))
  ) {
    return err(
      new MalformedParametersError(
        'Review and confirm the authentication fields to delete before saving. The form may have changed.',
      ),
    )
  }
  if (ids.length && form.status === FormStatus.Public) {
    return err(
      new FormOpenToResponsesError(
        'Close your form before deleting authentication fields.',
      ),
    )
  }
  if (
    (ids.length || expectedLastModified !== undefined) &&
    (!expectedLastModified ||
      !form.lastModified ||
      new Date(expectedLastModified).getTime() !==
        new Date(form.lastModified).getTime())
  )
    return err(new FormChangedWhileEditingError())

  const removed = new Set(ids)
  const form_fields = form.form_fields.filter(
    (field) => !removed.has(String(field._id)),
  )
  const form_logics = (form.form_logics ?? []).flatMap((logic) => {
    if (
      logic.conditions.some((condition) => removed.has(String(condition.field)))
    )
      return []
    if (logic.logicType !== LogicType.ShowFields) return [logic]
    const show = logic.show.filter((id) => !removed.has(String(id)))
    return show.length ? [{ ...toPlain(logic), show } as FormLogicSchema] : []
  })
  const cleanedWorkflow = workflow.map((step) => {
    const clean = {
      ...toPlain(step),
      edit: step.edit.filter((id) => !removed.has(String(id))),
    }
    if (clean.approval_field && removed.has(String(clean.approval_field))) {
      delete clean.approval_field
      clean.is_approval_enabled = false
    }
    if (
      ('field' in clean && removed.has(String(clean.field))) ||
      ('conditional_field' in clean &&
        removed.has(String(clean.conditional_field)))
    ) {
      const rerouted = {
        ...clean,
        workflow_type: WorkflowType.Static as const,
        emails: [],
      }
      Reflect.deleteProperty(rerouted, 'field')
      Reflect.deleteProperty(rerouted, 'conditional_field')
      return rerouted
    }
    return clean
  })
  return ok({
    form_fields,
    form_logics,
    workflow: cleanedWorkflow,
    // Only a write that deletes definitions rewrites them, and only while the
    // form is still the version the admin reviewed. Every write bumps
    // lastModified, so it stands for the whole reviewed form.
    deletionGuard: ids.length ? { lastModified: form.lastModified } : {},
    deletionUpdate: ids.length ? { form_fields, form_logics } : {},
  })
}

/** Select only a provider and Corppass configuration that actually exist on this workflow. */
export const getRetainedWorkflowAuth = (
  form: IPopulatedMultirespondentForm,
  input: DeleteWorkflowAuthDto,
) => {
  const workflow = form.workflow ?? []
  const configurations = (workflow.length ? workflow : [{ edit: [] }]).map(
    (_, index) => ({
      authType: getStepAuthType(form, workflow, index),
      esrvcId: getStepEsrvcId(form, workflow, index) ?? '',
    }),
  )
  const providers = [
    ...new Set(
      configurations
        .map((config) => config.authType)
        .filter(isWorkflowStepAuthType),
    ),
  ]
  const selected =
    input.retained_auth_type ??
    (providers.length === 1
      ? providers[0]
      : providers.length === 0
        ? FormAuthType.NIL
        : undefined)

  if (
    selected === undefined ||
    (selected !== FormAuthType.NIL && !providers.includes(selected))
  ) {
    return err(
      new MalformedParametersError(
        'Choose an authentication type already used by this workflow.',
      ),
    )
  }
  if (selected !== FormAuthType.CP) {
    if (input.retained_esrvc_id !== undefined)
      return err(
        new MalformedParametersError('Only Corppass has an e-service ID.'),
      )
    return ok({
      authType: selected,
      esrvcId: selected === form.authType ? (form.esrvcId ?? '') : '',
    })
  }
  const ids = [
    ...new Set(
      configurations
        .filter((config) => config.authType === FormAuthType.CP)
        .map((config) => config.esrvcId),
    ),
  ]
  const selectedId =
    input.retained_esrvc_id ?? (ids.length === 1 ? ids[0] : undefined)
  if (selectedId === undefined || !ids.includes(selectedId))
    return err(
      new MalformedParametersError(
        'Choose an existing Corppass e-service ID to retain.',
      ),
    )
  return ok({ authType: selected, esrvcId: selectedId })
}
