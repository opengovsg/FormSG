import { AdminFormDto, FormDto, PublicFormDto } from 'formsg-shared/types'

/**
 * Whether payments are enabled on the given form, tolerating the
 * not-yet-loaded (undefined) state.
 */
export const isFormPaymentsEnabled = (
  form?: FormDto | AdminFormDto | PublicFormDto,
): boolean => !!form && form.payments_field.enabled
