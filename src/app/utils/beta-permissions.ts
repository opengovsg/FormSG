import { BasicField, IFieldSchema, IUserSchema } from '../../types'

/**
 * Array contains all current beta fields. Add or remove field types as the beta
 * fields change.
 */
const BETA_FIELDS = [BasicField.Mobile]

/**
 * Checks whether the given user can create the given field.
 * @param _user the user document to check with
 * @param field the field to check against user eligibility
 * @returns true if the user can create the field, false otherwise
 */
export const userCanCreateField = (_user: IUserSchema, field: IFieldSchema) => {
  // All fields can currently be created, so return true regardless.
  switch (field.fieldType) {
    default:
      return true
  }
}

/**
 * Checks whether the given field is currently a beta field.
 * @param field the field to check.
 * @returns true if the field is in beta, false otherwise.
 */
export const isBetaField = (field: IFieldSchema) => {
  // All MyInfo fields should not be a beta field.
  return !field.myInfo && BETA_FIELDS.includes(field.fieldType)
}
