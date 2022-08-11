import mapValues from 'lodash/mapValues'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
