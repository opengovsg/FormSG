import { ResultAsync } from 'neverthrow'

import { IFieldSchema, IPopulatedForm } from '../../../../../types'
import { createLoggerWithLabel } from '../../../../config/logger'
import { transformMongoError } from '../../../../utils/handle-mongo-error'

import { getNewFormFields } from './fields.utils.spec'

const logger = createLoggerWithLabel(module)

/**
 * Updates form fields of given form depending on the given editFormFieldParams
 * @param originalForm the original form to update form fields for
 * @param formFieldToDuplicate the form field to duplicate
 *
 * @returns ok(updated form) if form fields update successfully
 * @returns err(EditFieldError) if any
 * @returns err(set of DatabaseError) if any database errors occurs
 */
export const duplicateFormFields = (
  originalForm: IPopulatedForm,
  formFieldToDuplicate: IFieldSchema | null,
): ResultAsync<IPopulatedForm, ReturnType<typeof transformMongoError>> => {
  return getNewFormFields(
    originalForm.form_fields,
    formFieldToDuplicate,
  ).asyncAndThen((newFormFields) => {
    // Update form fields of original form.
    originalForm.form_fields = newFormFields
    return ResultAsync.fromPromise(originalForm.save(), (error) => {
      logger.error({
        message: 'Error encountered while duplicating form fields',
        meta: {
          action: 'duplicateFormFields',
          originalForm,
          formFieldToDuplicate,
        },
        error,
      })
      return transformMongoError(error)
    })
  })
}
