import {
  DeleteWorkflowAuthDto,
  FormAuthType,
  FormStatus,
  FormWorkflowDto,
  LogicType,
  WorkflowType,
} from 'formsg-shared/types'
import {
  formUsesAuthType,
  getFieldSourceProvider,
  getStepAuthType,
  getStepEsrvcId,
} from 'formsg-shared/utils/step-login'
import { err, ok } from 'neverthrow'

import {
  IPopulatedForm,
  IPopulatedMultirespondentForm,
} from '../../../../types'
import { MalformedParametersError } from '../../core/core.errors'
import { FormOpenToResponsesError } from '../form.errors'

import { FormChangedWhileEditingError } from './admin-form.errors'

/** The client confirms exact definitions, never supplies an arbitrary deletion command. */
export const prepareAuthFieldDeletion = ({
  form,
  workflow,
  authType,
  confirmedIds,
  expectedLastModified,
}: {
  form: IPopulatedForm
  workflow: FormWorkflowDto
  authType: FormAuthType
  confirmedIds: unknown
  expectedLastModified?: unknown
}) => {
  const ids = form.form_fields
    .filter((field) => {
      const provider = getFieldSourceProvider(field)
      return provider && !formUsesAuthType({ authType, workflow }, provider)
    })
    .map((field) => String(field._id))
  if (
    confirmedIds !== undefined &&
    (!Array.isArray(confirmedIds) ||
      confirmedIds.some((id) => typeof id !== 'string') ||
      new Set(confirmedIds).size !== confirmedIds.length)
  ) {
    return err(
      new MalformedParametersError(
        'Invalid confirmed authentication field IDs.',
      ),
    )
  }
  const confirmed = (confirmedIds ?? []) as string[]
  if (
    ids.length !== confirmed.length ||
    ids.some((id) => !confirmed.includes(id))
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
    (typeof expectedLastModified !== 'string' ||
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
    return show.length
      ? [
          {
            ...(typeof logic.toObject === 'function'
              ? logic.toObject()
              : logic),
            show,
          },
        ]
      : []
  })
  const cleanedWorkflow = workflow.map((step) => {
    const clean = {
      ...(typeof (step as unknown as { toObject?: unknown }).toObject ===
      'function'
        ? (step as unknown as { toObject: () => typeof step }).toObject()
        : step),
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
    // What the resulting-form checks should see.
    checkedForm: {
      ...(typeof form.toObject === 'function' ? form.toObject() : form),
      form_fields,
    } as IPopulatedForm,
    // Only a write that deletes definitions guards and rewrites them.
    deletionGuard: ids.length ? getDeletionReferenceGuard(form) : {},
    deletionUpdate: ids.length ? { form_fields, form_logics } : {},
  })
}

const toSingpassFamily = (type: FormAuthType): FormAuthType =>
  type === FormAuthType.SP ? FormAuthType.MyInfo : type

export const sameAuthenticationProvider = (
  a: FormAuthType,
  b: FormAuthType,
): boolean => toSingpassFamily(a) === toSingpassFamily(b)

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
        .filter((type) => type !== FormAuthType.NIL),
    ),
  ]
  const families = [...new Set(providers.map(toSingpassFamily))]
  const requested =
    input.retained_auth_type ??
    (families.length === 1
      ? families[0]
      : families.length === 0
        ? FormAuthType.NIL
        : undefined)
  // SP and MyInfo are one Singpass choice. Keep legacy SP only when no
  // modern Singpass configuration exists; modern Myinfo fields need MyInfo.
  const selected =
    requested === FormAuthType.MyInfo &&
    !providers.includes(FormAuthType.MyInfo) &&
    providers.includes(FormAuthType.SP)
      ? FormAuthType.SP
      : requested

  if (
    selected === undefined ||
    (selected !== FormAuthType.NIL && !providers.includes(selected)) ||
    (input.retained_auth_type !== undefined &&
      input.retained_auth_type !== FormAuthType.MyInfo &&
      input.retained_auth_type !== FormAuthType.CP)
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
      esrvcId: sameAuthenticationProvider(selected, form.authType)
        ? (form.esrvcId ?? '')
        : '',
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

/** Guard reviewed definitions without order-sensitive BSON document equality. */
export const getDeletionReferenceGuard = (form: IPopulatedForm) => {
  const raw =
    typeof form.toObject === 'function'
      ? form.toObject({ getters: false })
      : form
  const guard: Record<string, unknown> = {}
  const add = (path: string, value: unknown, source?: unknown) => {
    const original = source as
      | ({ $isDefault?: (key: string) => boolean } & Record<string, unknown>)
      | undefined
    if (Array.isArray(value)) {
      guard[`${path}.${value.length}`] = { $exists: false }
      value.forEach((item, index) =>
        add(
          `${path}.${index}`,
          item,
          Array.isArray(source) ? source[index] : undefined,
        ),
      )
    } else if (value && Object.getPrototypeOf(value) === Object.prototype) {
      for (const [key, nested] of Object.entries(value)) {
        // Hydration may supply defaults absent from historical records. They
        // are not part of the saved configuration the admin reviewed.
        if (original?.$isDefault?.(key)) continue
        add(`${path}.${key}`, nested, original?.[key])
      }
    } else if (value !== undefined) guard[path] = value
  }
  add('form_fields', raw.form_fields, form.form_fields)
  add('form_logics', raw.form_logics, form.form_logics)
  if ('workflow' in raw)
    add(
      'workflow',
      raw.workflow,
      (form as IPopulatedMultirespondentForm).workflow,
    )
  add('whitelistedSubmitterIds', raw.whitelistedSubmitterIds)
  if (raw.lastModified) guard.lastModified = raw.lastModified
  guard.isSingleSubmission = raw.isSingleSubmission ?? { $in: [false, null] }
  guard.esrvcId = raw.esrvcId || { $in: ['', null] }
  return guard
}
