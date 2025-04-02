import { FormAuthType, FormResponseMode, FormStatus } from 'shared/types'

import { E2eSettingsOptions } from '../constants/settings'

export const getEncryptSettings = (
  custom?: Partial<E2eSettingsOptions>,
): E2eSettingsOptions => {
  return _getSettings(FormResponseMode.Encrypt, custom)
}

export const getEmailSettings = (
  custom?: Partial<E2eSettingsOptions>,
): E2eSettingsOptions => {
  return _getSettings(FormResponseMode.Email, custom)
}
const _getSettings = (
  responseMode: FormResponseMode,
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

  // Create
  const settings: E2eSettingsOptions = {
    status: FormStatus.Public,
    collaborators: [],
    authType: FormAuthType.NIL,
    isSubmitterIdCollectionEnabled: false,
    // By default, if emails is undefined, only the admin (current user) will receive.
    ...custom,
  }

  // Admin email is added by default for both encrypt and email forms, this is just to test the email page
  if (responseMode === FormResponseMode.Encrypt) {
    settings.emails = ['test2@open.gov.sg']
  }

  return settings
}
