import { err, ok } from 'neverthrow'

import { IFieldSchema } from '../../../../../types'
import { EditFormFieldResult } from '../admin-form.types'

import { EditFieldError } from './fields.errors'

/**
 * Private utility to insert given field in the existing form fields.
 * @param existingFormFields the existing form fields
 * @param fieldToInsert the field to insert into the back of current fields
 * @returns ok(new array with field inserted) if fieldToInsert does not already exist
 * @returns err(EditFieldError) if field to be inserted already exists in current fields
 */
const insertField = (
  existingFormFields: IFieldSchema[],
  fieldToInsert: IFieldSchema | null,
): EditFormFieldResult => {
  if (!fieldToInsert) {
    return err(new EditFieldError('Field to duplicate is not present'))
  }
  const doesFieldExist = existingFormFields.some(
    (f) => f.globalId === fieldToInsert.globalId,
  )

  return doesFieldExist
    ? err(
        new EditFieldError(
          `Field ${fieldToInsert.globalId} to be inserted already exists`,
        ),
      )
    : ok([...existingFormFields, fieldToInsert])
}

/**
 * Creates a field action. Use case applies to both creating and
 * duplicating form fields.
 * @param currentFormFields the existing form fields to update
 * @param fieldToAdd the parameters with the given update to perform and any metadata required.
 *
 * @returns ok(updated form fields array) if fields update successfully
 * @returns err(EditFieldError) if any errors occur whilst updating fields
 */
export const getNewFormFields = (
  currentFormFields: IFieldSchema[],
  fieldToAdd: IFieldSchema | null,
): EditFormFieldResult => {
  return insertField(currentFormFields, fieldToAdd)
}
