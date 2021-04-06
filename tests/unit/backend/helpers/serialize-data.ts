export const jsonParseStringify = (obj: unknown) => {
  return JSON.parse(JSON.stringify(obj))
}
