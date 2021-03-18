// Retrieved from https://www.npmjs.com/package/node-dotify and modified to ignore arrays.

/**
 * Transform any nested objects to string notation for mongoose update.
 * query.
 * @example { webhook: { url: 'something' } } --> { "webhook.url": 'something' }
 * @note This is required or mongoose will override nested objects wholesale.
 * @example { nested: { emails: [ { level: 1 }, { level: 2 } ] } } --> { nested.emails: [ { level: 1 }, { level: 2 } ] }
 * @note Arrays are ignored and will be returned immediately even if there may be further objects nesting.
 *
 * @param obj the initial object to dotify
 * @returns the dotified object
 */
export const dotifyObject = (
  obj: Record<string, unknown>,
): Record<string, unknown> => {
  const res: Record<string, unknown> = {}

  const recurse = (obj: Record<string, unknown>, currentPath?: string) => {
    for (const key in obj) {
      const value = obj[key]
      const newKey = currentPath ? currentPath + '.' + key : key // joined key with dot
      if (
        value &&
        typeof value === 'object' &&
        !(value instanceof Date) &&
        // Do not traverse deeper for arrays.
        !Array.isArray(value)
      ) {
        recurse(value as Record<string, unknown>, newKey) // it's a nested object, so do it again
      } else {
        res[newKey] = value // it's not an object, so set the property
      }
    }
  }

  recurse(obj)
  return res
}
