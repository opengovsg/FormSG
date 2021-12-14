export const jsonParseStringify = <T extends unknown>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}
