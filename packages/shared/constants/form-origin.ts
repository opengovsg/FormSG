import { FormOrigin } from '../types/form/form'

/**
 * Form-origin options shown during form set-up (paper-forms tracking).
 * Display copy lives in the frontend i18n locale files, keyed by these codes.
 */

/** Ordered exactly as shown on the form set-up origin screen (Screen 2). */
export const FORM_ORIGIN_OPTIONS = [
  FormOrigin.Paper,
  FormOrigin.DigitalNew,
  FormOrigin.DigitalEmail,
  FormOrigin.DigitalDocument,
  FormOrigin.DigitalSpreadsheet,
  FormOrigin.DigitalFormBuilder,
  FormOrigin.DigitalOthers,
] as const

/** The single option that reveals a free-text "please specify" input. */
export const FORM_ORIGIN_OTHERS_VALUE = FormOrigin.DigitalOthers

/** Re-exported from types/form so the entry type and prefix share one literal. */
export { FORM_ORIGIN_OTHERS_PREFIX } from '../types/form/form'

/** Max length of the embedded "please specify" detail; mirrors the form-title cap. */
export const FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH = 200
