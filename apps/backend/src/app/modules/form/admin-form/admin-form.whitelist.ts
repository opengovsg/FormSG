import {
  FORM_WHITELIST_CONTAINS_EMPTY_ROWS_ERROR_MESSAGE,
  FORM_WHITELIST_SETTING_CONTAINS_DUPLICATES_ERROR_MESSAGE,
  FORM_WHITELIST_SETTING_CONTAINS_INVALID_FORMAT_SUBMITTERID_ERROR_MESSAGE,
} from 'formsg-shared/constants'
import {
  EncryptedStringsMessageContentWithMyPrivateKey,
  encryptStringsMessage,
} from 'formsg-shared/utils/crypto'
import {
  isMFinSeriesValid,
  isNricValid,
} from 'formsg-shared/utils/nric-validation'
import { isUenValid } from 'formsg-shared/utils/uen-validation'
import { err, ok, Result } from 'neverthrow'

import { MalformedParametersError } from '../../core/core.errors'

import { InvalidWhitelistSettingError } from './admin-form.errors'

export const checkIsWhitelistSettingValid = (
  whitelistedSubmitterIds: string[] | null,
): { isValid: boolean; invalidReason?: string } => {
  if (!whitelistedSubmitterIds || whitelistedSubmitterIds.length <= 0) {
    return {
      isValid: true,
    }
  }

  // check for empty rows/entries
  const emptyRowIndex = whitelistedSubmitterIds.findIndex(
    (entry: string) => entry === '',
  )
  if (emptyRowIndex !== -1) {
    return {
      isValid: false,
      invalidReason: FORM_WHITELIST_CONTAINS_EMPTY_ROWS_ERROR_MESSAGE,
    }
  }

  // check for invalid NRIC/FIN/UEN format
  const invalidEntries = whitelistedSubmitterIds.filter((entry: string) => {
    return !(
      isNricValid(entry) ||
      isMFinSeriesValid(entry) ||
      isUenValid(entry)
    )
  })
  // check for invalid entries
  if (invalidEntries.length > 0) {
    return {
      isValid: false,
      invalidReason:
        FORM_WHITELIST_SETTING_CONTAINS_INVALID_FORMAT_SUBMITTERID_ERROR_MESSAGE(
          invalidEntries[0],
        ),
    }
  }

  // check for duplicates
  if (
    new Set(whitelistedSubmitterIds).size !== whitelistedSubmitterIds.length
  ) {
    return {
      isValid: false,
      invalidReason: FORM_WHITELIST_SETTING_CONTAINS_DUPLICATES_ERROR_MESSAGE,
    }
  }

  return {
    isValid: true,
  }
}

// Uppercased so entries match submitter IDs.
export const parseWhitelistCsvString = (
  whitelistCsvString: string | null,
): string[] | null => {
  if (!whitelistCsvString) {
    return null
  }
  return whitelistCsvString
    .split(',')
    .map((entry: string) => entry.trim().toUpperCase())
}

/**
 * Parses, validates and encrypts an eligible-respondent CSV with the form's public key.
 * The caller persists the result as a new immutable whitelist version.
 */
export const encryptWhitelistCsvString = (
  whitelistCsvString: string,
  publicKey: string | undefined,
): Result<
  EncryptedStringsMessageContentWithMyPrivateKey,
  InvalidWhitelistSettingError | MalformedParametersError
> => {
  const ids = parseWhitelistCsvString(whitelistCsvString)
  if (!ids || ids.length === 0) {
    return err(new InvalidWhitelistSettingError('Your csv is empty.'))
  }
  const validity = checkIsWhitelistSettingValid(ids)
  if (!validity.isValid) {
    return err(
      new InvalidWhitelistSettingError(
        validity.invalidReason ?? 'Invalid whitelist',
      ),
    )
  }
  if (!publicKey) {
    return err(new MalformedParametersError('Form does not have a public key'))
  }
  return ok(encryptStringsMessage(ids, publicKey))
}
