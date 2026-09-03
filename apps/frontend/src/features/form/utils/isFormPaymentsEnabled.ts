import { AdminFormDto, FormDto, PublicFormDto } from 'formsg-shared/types'

/**
 * Whether payments are enabled on the given form. All payment-capable
 * response modes (storage and multirespondent) carry payments_field; the
 * structural check exists only to narrow away the deprecated email mode
 * and the not-yet-loaded (undefined) state.
 */
export const isFormPaymentsEnabled = (
  form?: FormDto | AdminFormDto | PublicFormDto,
): form is Extract<
  FormDto | AdminFormDto | PublicFormDto,
  { payments_field: unknown }
> => !!form && 'payments_field' in form && form.payments_field.enabled
