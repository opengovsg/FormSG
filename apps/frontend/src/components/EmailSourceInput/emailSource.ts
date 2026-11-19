import { uniq } from 'lodash'

import { splitEmails } from '~components/EmailListInput'

export type EmailSourceFieldKind = 'emailField' | 'dropdownField'

export interface EmailSources {
  emails: string[]
  emailFields: string[]
  dropdownFields: string[]
}

export const EMAIL_VALUE_PREFIX = 'email:'
export const FIELD_VALUE_PREFIX = 'field:'
export const ACTION_VALUE_PREFIX = 'action:'
export const NEW_EMAIL_VALUE_PREFIX = 'new-email:'

export const emailValue = (email: string) => `${EMAIL_VALUE_PREFIX}${email}`
export const fieldValue = (fieldId: string) => `${FIELD_VALUE_PREFIX}${fieldId}`
export const panelValue = (kind: EmailSourceFieldKind) =>
  `${ACTION_VALUE_PREFIX}panel:${kind}`
export const addFieldValue = (kind: EmailSourceFieldKind) =>
  `${ACTION_VALUE_PREFIX}add:${kind}`

const EMAIL_PREFIXES = [EMAIL_VALUE_PREFIX, NEW_EMAIL_VALUE_PREFIX]

const toEmail = (value: string): string | undefined => {
  const prefix = EMAIL_PREFIXES.find((p) => value.startsWith(p))
  return prefix === undefined ? undefined : value.slice(prefix.length)
}

export const emailSourcesToValues = ({
  emails,
  emailFields,
  dropdownFields,
}: EmailSources): string[] => [
  ...emails.map(emailValue),
  ...emailFields.map(fieldValue),
  ...dropdownFields.map(fieldValue),
]

export const valuesToEmailSources = ({
  previous,
  next,
  fieldKinds,
}: {
  previous: EmailSources
  next: string[]
  fieldKinds: Map<string, EmailSourceFieldKind>
}): EmailSources => {
  const kindIncludingDeletedFields = (
    fieldId: string,
  ): EmailSourceFieldKind | undefined =>
    fieldKinds.get(fieldId) ??
    (previous.emailFields.includes(fieldId)
      ? 'emailField'
      : previous.dropdownFields.includes(fieldId)
        ? 'dropdownField'
        : undefined)

  const fieldIds = uniq(
    next.flatMap((value) =>
      value.startsWith(FIELD_VALUE_PREFIX)
        ? [value.slice(FIELD_VALUE_PREFIX.length)]
        : [],
    ),
  )

  return {
    emails: uniq(
      next.flatMap((value) => {
        const email = toEmail(value)
        return email === undefined ? [] : splitEmails(email)
      }),
    ),
    emailFields: fieldIds.filter(
      (id) => kindIncludingDeletedFields(id) === 'emailField',
    ),
    dropdownFields: fieldIds.filter(
      (id) => kindIncludingDeletedFields(id) === 'dropdownField',
    ),
  }
}
