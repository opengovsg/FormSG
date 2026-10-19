/**
 * The response drawer and the responses table name a question the same way:
 * the table's column header reads exactly as the drawer's question label. The
 * labelling lives here so the two cannot drift apart.
 */
import { FormFieldDto } from 'formsg-shared/types'
import { getVerifiedQuestionPrefix } from 'formsg-shared/utils/myinfo-prefix'

/** Marks a question whose answer was verified, e.g. `[Verified] Email`. */
export const getVerifiedQuestionLabel = (
  question: string,
  isVerified: boolean,
  verifiedLabel: string,
): string => (isVerified ? `[${verifiedLabel}] ${question}` : question)

/**
 * The column header for a form field, as the drawer labels its answers, e.g.
 * `[Myinfo] Name` or `[Verified] Email`.
 *
 * The drawer reads the `[Myinfo]` prefix off each stored question, where the
 * backend added it for answers filled from MyInfo or the login, Corppass
 * included. A column spans
 * every response, so the prefix comes from the field instead, treating it as
 * filled from the login.
 */
export const getFieldColumnHeader = (
  field: FormFieldDto,
  verifiedLabel: string,
): string =>
  getVerifiedQuestionLabel(
    `${getVerifiedQuestionPrefix(field, new Set([field._id]))}${field.title}`,
    'isVerifiable' in field && field.isVerifiable,
    verifiedLabel,
  )
