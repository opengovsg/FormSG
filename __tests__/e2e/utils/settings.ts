import { FormAuthType, FormStatus } from 'shared/types'

import { E2eSettingsOptions } from '../constants/settings'

export const getSettings = (
  custom?: Partial<E2eSettingsOptions>,
): E2eSettingsOptions => {
  // Inject form auth settings
  if (custom?.authType && custom.authType !== FormAuthType.NIL) {
    // Only SGID does not require e-service ID
    if (custom.authType !== FormAuthType.SGID && !custom.esrvcId) {
      custom.esrvcId = 'test_esrvcid'
    }
    // All auth types have an NRIC
    if (!custom.nric) {
      custom.nric =
        custom.authType === FormAuthType.CP
          ? process.env.MOCKPASS_UID
          : process.env.MOCKPASS_NRIC
    }
    // Only CP has UEN and a special associated UID
    if (custom.authType === FormAuthType.CP && !custom.uen) {
      custom.uen = process.env.MOCKPASS_UEN
    }
  }

  return {
    status: FormStatus.Public,
    collaborators: [],
    authType: FormAuthType.NIL,
    // By default, if emails is undefined, only the admin (current user) will receive.
    ...custom,
  }
}
