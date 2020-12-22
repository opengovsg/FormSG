import { pick } from 'lodash'
import { err, ok } from 'neverthrow'
import { UnreachableCaseError } from 'ts-essentials'

import { VerifiedKeys } from '../../../shared/util/verified-content'
import { AuthType } from '../../../types'

import { MalformedVerifiedContentError } from './verified-content.errors'
import {
  CpVerifiedContent,
  ICpVerifiedKeys,
  SpVerifiedContent,
  SpVerifiedKeys,
  VerifiedContentResult,
  VerifiedKeyMap,
} from './verified-content.types'

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
const SP_KEYMAP_TO_NEW_KEY: SpVerifiedKeys = {
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
 * Returns the correct mapping layer according to given type. If no type is
 * given, an empty object is returned.
 * @param type Type of mapping layer to retrieve
 * @returns {Record<string, string} The mapping layer
 */
const getVerifiedKeyMap = (
  type: Exclude<AuthType, AuthType.NIL>,
): VerifiedKeyMap => {
  switch (type) {
    case AuthType.SP:
      return SP_KEYMAP_TO_NEW_KEY
    case AuthType.CP:
      return CP_KEYMAP_TO_NEW_KEY
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
 * Typeguard to assert that the given data has the shape of `CpVerifiedContent`.
 */
const isCpVerifiedContent = (
  data: Record<string, unknown>,
): data is CpVerifiedContent => {
  const cpKeys: (keyof CpVerifiedContent)[] = [
    VerifiedKeys.CpUen,
    VerifiedKeys.CpUid,
  ]
  return cpKeys.every(
    (cpKey) => cpKey in data && typeof data[cpKey] === 'string',
  )
}

/**
 * Typeguard to assert that the given data has the shape of `SpVerifiedContent`.
 */
export const isSpVerifiedContent = (
  data: Record<string, unknown>,
): data is SpVerifiedContent => {
  const spKeys: (keyof SpVerifiedContent)[] = [VerifiedKeys.SpUinFin]
  return spKeys.every(
    (spKey) => spKey in data && typeof data[spKey] === 'string',
  )
}

export const assertCpVerifiedContentShape = (
  data: Record<string, unknown>,
): VerifiedContentResult<CpVerifiedContent> => {
  return isCpVerifiedContent(data)
    ? ok(data)
    : err(new MalformedVerifiedContentError())
}

export const assertSpVerifiedContentShape = (
  data: Record<string, unknown>,
): VerifiedContentResult<SpVerifiedContent> => {
  return isSpVerifiedContent(data)
    ? ok(data)
    : err(new MalformedVerifiedContentError())
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
  type: Exclude<AuthType, AuthType.NIL>
  data: Record<string, unknown>
}): Record<string, unknown> => {
  const fieldMap = getVerifiedKeyMap(type)
  const subsetKeys = pick(data, Object.keys(fieldMap))

  return renameKeys(subsetKeys, fieldMap)
}
