import {
  FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH,
  FORM_ORIGIN_OTHERS_PREFIX,
  FORM_ORIGIN_OTHERS_VALUE,
} from '../constants/form-origin'
import { FormOrigin } from '../types/form/form'

const VALID_FORM_ORIGINS = new Set<string>(Object.values(FormOrigin))

/** Whether a value is one of the recognised form-origin codes. */
export const isValidFormOrigin = (value: unknown): value is FormOrigin =>
  typeof value === 'string' && VALID_FORM_ORIGINS.has(value)

export type FormOriginsValidationError =
  | 'AT_LEAST_ONE'
  | 'INVALID_VALUE'
  | 'DUPLICATE_VALUE'
  | 'OTHER_DETAIL_REQUIRED'
  | 'OTHER_DETAIL_TOO_LONG'

/**
 * Canonicalises a selection for persistence: "Others" entries are rebuilt as
 * `digital-others: <trimmed detail>` so padded variants never persist.
 */
export const normalizeFormOrigins = (
  formOrigins: readonly string[],
): string[] =>
  formOrigins.map((entry) =>
    entry.startsWith(FORM_ORIGIN_OTHERS_PREFIX)
      ? `${FORM_ORIGIN_OTHERS_PREFIX}${entry
          .slice(FORM_ORIGIN_OTHERS_PREFIX.length)
          .trim()}`
      : entry,
  )

/**
 * Validates a form-origins selection: ≥1 entry, recognised codes only, no
 * repeated origin, and "Others" must embed a non-blank free-text detail
 * (`digital-others: <detail>`) within the length cap. Presence policy is the
 * caller's — the backend skips this check when no origin data is sent.
 *
 * @returns the first failing rule, or `null` if the selection is valid.
 */
export const validateFormOriginsSelection = (
  formOrigins: readonly string[] | undefined | null,
): FormOriginsValidationError | null => {
  if (!formOrigins || formOrigins.length === 0) {
    return 'AT_LEAST_ONE'
  }
  const seenCodes = new Set<FormOrigin>()
  for (const entry of formOrigins) {
    let code: FormOrigin
    if (entry.startsWith(FORM_ORIGIN_OTHERS_PREFIX)) {
      const detail = entry.slice(FORM_ORIGIN_OTHERS_PREFIX.length).trim()
      if (!detail) {
        return 'OTHER_DETAIL_REQUIRED'
      }
      if (detail.length > FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH) {
        return 'OTHER_DETAIL_TOO_LONG'
      }
      code = FORM_ORIGIN_OTHERS_VALUE
    } else if (isValidFormOrigin(entry)) {
      // A bare "Others" code carries no detail, which is mandatory.
      if (entry === FORM_ORIGIN_OTHERS_VALUE) {
        return 'OTHER_DETAIL_REQUIRED'
      }
      code = entry
    } else {
      return 'INVALID_VALUE'
    }
    if (seenCodes.has(code)) {
      return 'DUPLICATE_VALUE'
    }
    seenCodes.add(code)
  }
  return null
}
