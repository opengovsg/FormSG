import { FormOrigin } from '../types/form/form'

export const FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH = 200
/**
 * Form-origin answers shown during form set-up for paper forms tracking.
 * Ordered exactly as shown on the form set-up origin screen.
 *
 * Older forms may still carry the medium codes (email, document,
 * spreadsheet, form builder) and "Other" text from the earlier
 * two-question flow; those stay valid in FormOrigin but are no longer asked.
 */
export const FORM_ORIGIN_OPTIONS = [
  FormOrigin.DigitalNew,
  FormOrigin.DigitalExisting,
  FormOrigin.Paper,
] as const

/**
 * Whether a formOrigins.value array represents a "new process" answer, i.e.
 * consists solely of the new-process code. Mixed values (legacy rows that
 * combine DigitalNew with a real medium) are not treated as new-process.
 */
export const isNewProcessFormOrigin = (value: string[]): boolean =>
  value.length === 1 && value[0] === FormOrigin.DigitalNew
