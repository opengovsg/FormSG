import {
  FormResponseMode,
  FormSettings,
  MultirespondentFormSettings,
  StorageFormSettings,
} from 'formsg-shared/types'

/**
 * Typeguard for settings of payment-capable response modes (storage and
 * multirespondent). Both carry payments_channel/payments_field/business.
 */
export const isPaymentCapableFormSettings = (
  settings: FormSettings,
): settings is StorageFormSettings | MultirespondentFormSettings =>
  settings.responseMode === FormResponseMode.Encrypt ||
  settings.responseMode === FormResponseMode.Multirespondent
