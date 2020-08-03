// This file contains mapping layers for verifiedContent in encrypted submission
// data.
// The mapping layers will translate certain keys such as SingPass login key
// values to keys that our application has designated.
import pick from 'lodash/pick'
import values from 'lodash/values'

// Centralised mapping layer for use in other files to get the mapped value.
export enum VerifiedKeys {
  SpUinFin = 'uinFin',
  CpUen = 'cpUen',
  CpUid = 'cpUid',
}

interface ISpVerifiedKeys {
  uinFin: VerifiedKeys.SpUinFin
}

// Note: The same key in different contexts such as authType can be mapped to a
// different key. This is why there exists different mapping layers instead of
// just one.
const SpVerifiedKeys: ISpVerifiedKeys = {
  uinFin: VerifiedKeys.SpUinFin,
}

interface ICpVerifiedKeys {
  uinFin: VerifiedKeys.CpUen
  userInfo: VerifiedKeys.CpUid
}

const CpVerifiedKeys: ICpVerifiedKeys = {
  uinFin: VerifiedKeys.CpUen,
  userInfo: VerifiedKeys.CpUid,
}

// Array determines the order to process and display the verified fields in both
// the detailed responses page and the csv file.
export const CURRENT_VERIFIED_FIELDS: VerifiedKeys[] = []
  .concat(values(SpVerifiedKeys))
  .concat(values(CpVerifiedKeys))

export type VerifiedKeyMap = ISpVerifiedKeys | ICpVerifiedKeys | {}
/**
 * Returns the correct mapping layer according to given type. If no type is
 * given, an empty object is returned.
 * @param type Type of mapping layer to retrieve
 * @returns {Record<string, string} The mapping layer
 */
const getVerifiedKeyMap = (type?: 'SP' | 'CP'): VerifiedKeyMap => {
  switch (type) {
    case 'SP':
      return SpVerifiedKeys
    case 'CP':
      return CpVerifiedKeys
    default:
      return {}
  }
}

/**
 * Helper function to rename keys in given object {@param obj} with a mapping
 * {@param newKeys}.
 * @param obj The object to rename keys for
 * @param newKeys The oldKey-newKey mapping
 * @returns A new object with the renamed keys
 */
const renameKeys = (
  obj: Record<VerifiedKeys, any>,
  newKeys: VerifiedKeyMap,
) => {
  const keyValues = Object.keys(obj).map((key) => {
    const newKey = newKeys[key] || key
    return { [newKey]: obj[key] }
  })
  return Object.assign({}, ...keyValues)
}

interface IMappableData {
  type?: 'SP' | 'CP'
  data: Record<string, any>
}

/**
 *  Return new object with only the keys that exist in the field mapping,
 * with their new keys as mapped. For example,
 *    type = 'CP',
 *    data = { uinFin: '1234567', other: '123' }
 * will return
 *    { cpUen: '1234567' }
 * as `uinFin` is mapped to `cpUen`. `other` is removed
 * as the key does not map to anything.
 */
export const mapDataToKey = ({ type, data }: IMappableData) => {
  const fieldMap = getVerifiedKeyMap(type)
  const subsetKeys = pick(data, Object.keys(fieldMap)) as Record<
    VerifiedKeys,
    any
  >

  return renameKeys(subsetKeys, fieldMap)
}
