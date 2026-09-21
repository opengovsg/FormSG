import mapValues from 'lodash/mapValues'

// oxlint-disable-next-line typescript/no-explicit-any
export const trimStringsInObject = <T extends Record<string, any>>(
  obj: T,
): T => {
  return mapValues(obj, (val) => {
    if (typeof val === 'string') {
      return val.trim()
    }
    return val
  })
}
