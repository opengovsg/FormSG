import { VERIFIED_FIELDTYPES } from '../../../shared/util/verification'
import { IFieldSchema } from '../../../types'

/**
 * Evaluates whether a field is verifiable
 * @param field
 */
const isFieldVerifiable = (field: IFieldSchema): boolean => {
  return (
    VERIFIED_FIELDTYPES.includes(field.fieldType) && field.isVerifiable === true
  )
}

/**
 * Gets verifiable fields from form and initializes the values to be stored in a transaction
 * @param form
 */
export const extractTransactionFields = (
  formFields: IFieldSchema[],
): Pick<IFieldSchema, '_id' | 'fieldType'>[] => {
  return formFields.filter(isFieldVerifiable).map(({ _id, fieldType }) => ({
    _id,
    fieldType,
  }))
}
