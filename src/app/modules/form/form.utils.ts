import { FormPermission, FormResponseMode } from '../../../../shared/types'
import {
  FormFieldSchema,
  FormLogicSchema,
  IEncryptedFormSchema,
  IFormHasEmailSchema,
  IFormSchema,
  IMultirespondentFormSchema,
  IPopulatedEmailForm,
  IPopulatedForm,
} from '../../../types'
import { isMongooseDocumentArray } from '../../utils/mongoose'

// Converts 'test@hotmail.com, test@gmail.com' to ['test@hotmail.com', 'test@gmail.com']
export const transformEmailString = (v: string): string[] => {
  return v
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((email) => email.includes('@')) // remove ""
}

// Function that coerces the string of comma-separated emails sent by the client
// into an array of emails
export const transformEmails = (v: string | string[]): string[] => {
  // Cases
  // ['test@hotmail.com'] => ['test@hotmail.com'] ~ unchanged
  // ['test@hotmail.com', 'test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com'] ~ unchanged
  // ['test@hotmail.com, test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com']
  // ['test@hotmail.com, test@gmail.com', 'test@yahoo.com'] => ['test@hotmail.com', 'test@gmail.com', 'test@yahoo.com']
  // 'test@hotmail.com, test@gmail.com' => ['test@hotmail.com', 'test@gmail.com']
  if (Array.isArray(v)) {
    return v.flatMap(transformEmailString)
  } else {
    return transformEmailString(v)
  }
}

/**
 * Typeguard to check if given form is an encrypt mode form.
 * @param form the form to check
 * @returns true if form is encrypt mode form, false otherwise.
 */
export const isFormEncryptMode = (
  form: IFormSchema | IPopulatedForm,
): form is IEncryptedFormSchema => {
  return form.responseMode === FormResponseMode.Encrypt
}

/**
 * Typeguard to check if given form is a multirespondentform.
 * @param form the form to check
 * @returns true if form is multirespondent form, false otherwise.
 */
export const isFormMultirespondent = (
  form: IFormSchema | IPopulatedForm,
): form is IMultirespondentFormSchema => {
  return form.responseMode === FormResponseMode.Multirespondent
}

/**
 * Typeguard to check if given form is a multirespondentform.
 * @param form the form to check
 * @returns true if form is multirespondent form, false otherwise.
 */
export const isFormEncryptModeOrMultirespondent = (
  form: IFormSchema | IPopulatedForm,
): form is IEncryptedFormSchema | IMultirespondentFormSchema => {
  return (
    form.responseMode === FormResponseMode.Encrypt ||
    form.responseMode === FormResponseMode.Multirespondent
  )
}

/**
 * Extracts emails of collaborators, optionally filtering for a specific
 * write permission.
 * @param permissionList List of collaborators
 * @param writePermission Optional write permission to filter on
 * @returns Array of emails
 */
export const getCollabEmailsWithPermission = (
  permissionList?: FormPermission[],
  writePermission?: boolean,
): string[] => {
  if (!permissionList) {
    return []
  }
  return permissionList.reduce<string[]>((acc, collaborator) => {
    if (
      writePermission === undefined ||
      writePermission === collaborator.write
    ) {
      acc.push(collaborator.email)
    }
    return acc
  }, [])
}

export const getAdminEmails = (
  form: Partial<IFormHasEmailSchema>,
): string[] => {
  if (form.emails == null) {
    return []
  }

  if (typeof form.emails === 'string') {
    return [form.emails]
  }

  return form.emails
}

/**
 * Type guard for whether a populated form is email mode
 * @param form Form document to check
 */
export const isEmailModeForm = (
  form: IPopulatedForm,
): form is IPopulatedEmailForm => {
  return form.responseMode === FormResponseMode.Email
}

/**
 * Finds and returns form field in given form by its id
 * @param formFields the form fields to search from
 * @param fieldId the id of the field to retrieve
 * @returns the form field if found, `null` otherwise
 */
export const getFormFieldById = (
  formFields: IFormSchema['form_fields'],
  fieldId: FormFieldSchema['_id'],
): FormFieldSchema | null => {
  if (!formFields) {
    return null
  }

  if (isMongooseDocumentArray(formFields)) {
    return formFields.id(fieldId)
  }

  return formFields.find((f) => fieldId === String(f._id)) ?? null
}

export const getFormFieldIndexById = (
  formFields: IFormSchema['form_fields'],
  fieldId: FormFieldSchema['_id'],
): number | null => {
  if (!formFields) {
    return null
  }

  const index = formFields.findIndex((f) => fieldId === String(f._id))
  // if index is negative, fieldId does not exist in formFields
  return index >= 0 ? index : null
}

/**
 * Finds and returns form logic in given form by its id
 * @param form_logics the logics to search from
 * @param logicId the id of the logic to retrieve
 * @returns the logic if found, `null` otherwise
 */
export const getLogicById = (
  form_logics: IFormSchema['form_logics'],
  logicId: FormLogicSchema['_id'],
): FormLogicSchema | null => {
  if (!form_logics) {
    return null
  }

  if (isMongooseDocumentArray(form_logics)) {
    return form_logics.id(logicId)
  }

  return form_logics.find((logic) => logicId === String(logic._id)) ?? null
}

/**
 * Regex to to detect invalid-encoded utf-8 characters in stringified form field input
 * Matches any sequence which starts with a non-backslash, an odd number of backslashes, followed by unicode escape sequence
 * See https://mathiasbynens.be/notes/javascript-escapes for regex on unicode escape sequences
 */
export const UNICODE_ESCAPED_REGEX = /[^\\](\\\\)*\\u[0-9a-fA-F]{4}/
