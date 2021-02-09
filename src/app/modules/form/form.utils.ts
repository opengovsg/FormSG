import { pick } from 'lodash'
import { Merge } from 'type-fest'

import {
  IPopulatedForm,
  Permission,
  IEncryptedFormSchema,
  IFormSchema,
  ResponseMode,
} from '../../../types'

// Kept in this file instead of form.types.ts so that this can be kept in sync
// with FORM_PUBLIC_FIELDS more easily.
type PublicFormValues = Pick<
  IPopulatedForm,
  | 'authType'
  | 'endPage'
  | 'esrvcId'
  | 'form_fields'
  | 'form_logics'
  | 'hasCaptcha'
  | 'publicKey'
  | 'startPage'
  | 'status'
  | 'title'
  | '_id'
  | 'responseMode'
>

type PublicForm = Merge<
  PublicFormValues,
  { admin: Pick<IPopulatedForm['admin'], 'agency'> }
>

const FORM_PUBLIC_FIELDS = [
  'admin',
  'authType',
  'endPage',
  'esrvcId',
  'form_fields',
  'form_logics',
  'hasCaptcha',
  'publicKey',
  'startPage',
  'status',
  'title',
  '_id',
  'responseMode',
]

/**
 * Removes all private details such as admin email from given form.
 * @param form the form to scrub
 * @returns form with only public details
 */
export const removePrivateDetailsFromForm = (
  form: IPopulatedForm,
): PublicForm => {
  return {
    ...(pick(form, FORM_PUBLIC_FIELDS) as PublicFormValues),
    admin: pick(form.admin, 'agency'),
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
  return form.responseMode === ResponseMode.Encrypt
}

/**
 * Extracts emails of collaborators, optionally filtering for a specific
 * write permission.
 * @param permissionList List of collaborators
 * @param writePermission Optional write permission to filter on
 * @returns Array of emails
 */
export const getCollabEmailsWithPermission = (
  permissionList?: Permission[],
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
