import { FormOrigin } from '../types/form/form'

/**
 * Form-origin options shown during form set-up (paper-forms tracking).
 * Display copy lives in the frontend i18n locale files, keyed by these codes.
 */

/**
 * Ordered exactly as shown on the form set-up origin screen (Screen 2).
 *
 * "Others" is not listed here: it is the checkbox field's built-in free-text
 * option, carried in CheckboxFieldResponsesV3.othersInput rather than as an
 * origin code.
 */
export const FORM_ORIGIN_OPTIONS = [
  FormOrigin.Paper,
  FormOrigin.DigitalNew,
  FormOrigin.DigitalEmail,
  FormOrigin.DigitalDocument,
  FormOrigin.DigitalSpreadsheet,
  FormOrigin.DigitalFormBuilder,
] as const
