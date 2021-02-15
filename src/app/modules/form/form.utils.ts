import {
  IEncryptedFormSchema,
  IFormSchema,
  IPopulatedForm,
  Permission,
  ResponseMode,
} from '../../../types'

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
    return transformEmailString(v.join(','))
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
