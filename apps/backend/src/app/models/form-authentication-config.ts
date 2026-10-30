import { FormResponseMode, FormWorkflowDto } from 'formsg-shared/types'
import { LoginIdentityCandidate } from 'formsg-shared/utils/login-identity'
import mongoose from 'mongoose'

import { IFormDocument } from 'src/types'

// Authentication validation and publication must apply to the same authentication configuration.
export const getCheckedAuthenticationConfigFilter = (form: IFormDocument) => {
  const filter: Record<string, unknown> = {
    status: form.status,
    authType: form.authType,
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
      filter[`${prefix}.auth.esrvc_id`] = step.auth?.esrvc_id || {
        $in: ['', null],
      }
    })
  }
  return filter
}

export const saveWithAuthenticationConfigGuard = (
  form: IFormDocument,
  checkedConfig: Record<string, unknown>,
) => {
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
