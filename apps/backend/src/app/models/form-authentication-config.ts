import { FormResponseMode, FormWorkflowDto } from 'formsg-shared/types'
import { LoginIdentityCandidate } from 'formsg-shared/utils/login-identity'
import {
  getAuthEsrvcId,
  hasLaterStepLogin,
} from 'formsg-shared/utils/step-login'
import mongoose from 'mongoose'

import { IFormDocument } from 'src/types'

// Authentication validation and publication must apply to the same authentication configuration.
export const getCheckedAuthenticationConfigFilter = (form: IFormDocument) => {
  const filter: Record<string, unknown> = {
    status: form.status,
    authType: form.authType,
    // Step 1's e-service ID, normalised like a later step's below
    esrvcId: form.esrvcId || { $in: ['', null] },
    isSubmitterIdCollectionEnabled: form.isSubmitterIdCollectionEnabled
      ? true
      : { $in: [false, null] },
  }
  const fields = form.form_fields ?? []
  filter[`form_fields.${fields.length}`] = { $exists: false }
  fields.forEach((field, index) => {
    const sourceField: LoginIdentityCandidate = field
    const prefix = `form_fields.${index}`
    filter[`${prefix}._id`] = field._id
    filter[`${prefix}.fieldType`] = field.fieldType
    filter[`${prefix}.myInfo.attr`] = sourceField.myInfo?.attr ?? {
      $exists: false,
    }
    filter[`${prefix}.corppass.attr`] = sourceField.corppass?.attr ?? {
      $exists: false,
    }
  })
  if (form.responseMode === FormResponseMode.Multirespondent) {
    const workflow =
      (form as IFormDocument & { workflow?: FormWorkflowDto }).workflow ?? []
    filter[`workflow.${workflow.length}`] = { $exists: false }
    workflow.forEach((step, index) => {
      const prefix = `workflow.${index}`
      filter[`${prefix}.edit`] = [...step.edit]
      filter[`${prefix}.auth.auth_type`] = step.auth?.auth_type ?? {
        $exists: false,
      }
      filter[`${prefix}.auth.esrvc_id`] = getAuthEsrvcId(step.auth) || {
        $in: ['', null],
      }
    })
  }
  return filter
}

/**
 * The guard field writes use. Forms with a later-step login guard their whole
 * authentication configuration. Other MRF forms only guard that no step has
 * gained a login since the read, so a stale field write can't land on a
 * workflow that now has one. Other forms save as before.
 */
export const getStepLoginAuthenticationConfigGuard = (
  form: IFormDocument,
): Record<string, unknown> | undefined => {
  if (form.responseMode !== FormResponseMode.Multirespondent) return undefined
  return hasLaterStepLogin(
    (form as IFormDocument & { workflow?: FormWorkflowDto }).workflow,
  )
    ? getCheckedAuthenticationConfigFilter(form)
    : // auth_type, not auth: `$exists` counts a stored null as present.
      { 'workflow.auth.auth_type': { $exists: false } }
}

export const saveWithAuthenticationConfigGuard = (
  form: IFormDocument,
  checkedConfig: Record<string, unknown> | undefined,
) => {
  if (!checkedConfig) return form.save()
  const originalWhere = form.$where
  form.$where = { ...originalWhere, ...checkedConfig }
  return form
    .save()
    .catch((error: unknown) =>
      Promise.reject(
        error instanceof mongoose.Error.DocumentNotFoundError
          ? new mongoose.Error.VersionError(form, form.get('__v') ?? 0, [
              'status',
              'form_fields',
              'workflow',
            ])
          : error,
      ),
    )
    .finally(() => {
      form.$where = originalWhere
    })
}
