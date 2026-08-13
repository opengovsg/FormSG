import { FormOrigin } from '../types/form/form'

export const FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH = 200
/**
 * Form-origin options shown during form set-up for paper forms tracking.
 * Ordered exactly as shown on the form set-up origin screen.
 *
 * Others option uses the CheckboxFieldResponsesV3.othersInput
 * rather than as an origin code.
 */
export const FORM_ORIGIN_OPTIONS = [
  FormOrigin.Paper,
  FormOrigin.DigitalNew,
  FormOrigin.DigitalEmail,
  FormOrigin.DigitalDocument,
  FormOrigin.DigitalSpreadsheet,
  FormOrigin.DigitalFormsg,
  FormOrigin.DigitalFormBuilder,
] as const

/**
 * Medium options for the "how is this data being collected today?" question.
 * Derived from FORM_ORIGIN_OPTIONS with the new-process value excluded, so
 * the two lists can't drift apart when an option is added or renamed.
 */
export const FORM_ORIGIN_MEDIUM_OPTIONS = FORM_ORIGIN_OPTIONS.filter(
  (code) => code !== FormOrigin.DigitalNew,
)

/**
 * Whether a formOrigins.value array represents a "new process" answer, i.e.
 * consists solely of the new-process code. Mixed values (legacy rows that
 * combine DigitalNew with a real medium) are not treated as new-process.
 */
export const isNewProcessFormOrigin = (value: string[]): boolean =>
  value.length === 1 && value[0] === FormOrigin.DigitalNew
