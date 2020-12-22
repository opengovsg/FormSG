/**
 * This file contains mapping layers for `verifiedContent` in encrypted submission
 * data.
 * The mapping layers will translate certain keys such as SingPass login key
 * values to keys that our application has designated.
 */
import pick from 'lodash/pick'
import values from 'lodash/values'
import { UnreachableCaseError } from 'ts-essentials'

import { AuthType } from '../../types'

// Centralised mapping layer for use in other files to get the mapped value.
export enum VerifiedKeys {
  SpUinFin = 'uinFin',
  CpUen = 'cpUen',
  CpUid = 'cpUid',
}

interface ISpVerifiedKeys {
  uinFin: VerifiedKeys.SpUinFin
}

interface ICpVerifiedKeys {
  uinFin: VerifiedKeys.CpUen
  userInfo: VerifiedKeys.CpUid
}

/**
 * @note The same key in different contexts such as authType can be mapped to a
 * different key. This is why there exists different mapping layers instead of
 * just one.
 *
 * For example, `uinFin` key in AuthType.SP context maps to
 * `VerifiedKeys.SpUinFin` for use in this application.
 * Upstream also returns the `uinFin` key for the AuthType.CP context. To
 * differentiate between the two contexts in this application, the mapping layer
 * will map the `uinFin` key for CP upstream into the `VerifiedKeys.CpUen` key.
 */

/**
 * Maps key given by SingPass JWT upstream to key that our application understands.
 */
const SP_KEYMAP_TO_NEW_KEY: ISpVerifiedKeys = {
  uinFin: VerifiedKeys.SpUinFin,
}

/**
 * Maps key given by CorpPass JWT upstream to key that our application understands.
 */
const CP_KEYMAP_TO_NEW_KEY: ICpVerifiedKeys = {
  uinFin: VerifiedKeys.CpUen,
  userInfo: VerifiedKeys.CpUid,
}

/**
 * Array determines the order to process and display the verified fields in both
 * the detailed responses page and the csv file.
 */
export const CURRENT_VERIFIED_FIELDS: VerifiedKeys[] = ([] as VerifiedKeys[])
  .concat(values(SP_KEYMAP_TO_NEW_KEY))
  .concat(values(CP_KEYMAP_TO_NEW_KEY))

export type VerifiedKeyMap =
  | ISpVerifiedKeys
  | ICpVerifiedKeys
  | Record<string, unknown>

/**
 * Returns the correct mapping layer according to given type. If no type is
 * given, an empty object is returned.
 * @param type Type of mapping layer to retrieve
 * @returns {Record<string, string} The mapping layer
 */
const getVerifiedKeyMap = (type: AuthType): VerifiedKeyMap => {
  switch (type) {
    case AuthType.SP:
      return SP_KEYMAP_TO_NEW_KEY
    case AuthType.CP:
      return CP_KEYMAP_TO_NEW_KEY
    case AuthType.NIL:
      return {}
    default:
      throw new UnreachableCaseError(type)
  }
}

/**
 * Helper function to rename keys in given object {@param obj} with a mapping
 * {@param newKeys}.
 * @param obj The object to rename keys for
 * @param newKeys The oldKey-newKey mapping
 * @returns A new object with the renamed keys
 */
const renameKeys = (obj: Record<string, any>, newKeys: Record<string, any>) => {
  const keyValues = Object.keys(obj).map((key) => {
    const newKey = newKeys[key] || key
    return { [newKey]: obj[key] }
  })
  return Object.assign({}, ...keyValues)
}

/**
 * Return new object with only the keys that exist in the field mapping,
 * with their new keys as mapped.
 * For example,
 * ```
 * { type: 'CP', data: { uinFin: '1234567', other: '123' } }
 * ```
 * will be mapped to
 * ```
 * { cpUen: '1234567' }
 * ```
 * as `uinFin` is mapped to `cpUen`. `other` is removed
 * as the key does not map to anything.
 */
export const mapDataToKey = ({
  type,
  data,
}: {
  type: AuthType
  data: Record<string, unknown>
}): Record<string, unknown> => {
  const fieldMap = getVerifiedKeyMap(type)
  const subsetKeys = pick(data, Object.keys(fieldMap))

  return renameKeys(subsetKeys, fieldMap)
}
