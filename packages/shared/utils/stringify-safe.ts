import stringify from 'json-stringify-safe'

/**
 * `JSON.stringify` docs:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
 *
 * `JSON.stringify` throws an exception in two cases: if circular references are
 * found, and if a value is of type `bigint`.
 *
 * This function wraps JSON.stringify
 * in checks to make sure circular references are dealt with (by the
 * `json-stringify-safe` library) and `BigInts` are converted to `Numbers`, so
 * `JSON.stringify` does not throw any errors. It is useful for stringifying
 * objects which are passed to us by external systems, e.g. HTTP responses.
 *
 * Currently does not support the replacer or spaces arguments to
 * JSON.stringify.
 * @param obj the object to be stringified
 */
export const stringifySafe = (obj: unknown): string | undefined => {
  return stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  )
}
