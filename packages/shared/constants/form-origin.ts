import { FormOrigin } from '../types/form/form'

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
  FormOrigin.DigitalFormBuilder,
] as const
