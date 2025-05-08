declare module 'convict-format-with-validator' {
  function coerce(v): string
  function validate(x): void

  export const url = {
    name: 'url' as const,
    coerce,
    validate,
  }

  export const ipaddress = {
    name: 'ipaddress' as const,
    coerce,
    validate,
  }

  export const email = {
    name: 'email' as const,
    coerce,
    validate,
  }

  /**
   * RATIONALE: Required for env vars which are potentially undefined but passed via SSM which require a non-empty string.
   * Hence, a placeholder is used to indicate that the value is undefined.
   */
  const UNDEFINED_PLACEHOLDER_STRING = '__UNDEFINED__'
  export const possiblyUndefinedString = {
    name: 'possiblyUndefinedString' as const,
    coerce: (v) => (v === UNDEFINED_PLACEHOLDER_STRING ? undefined : v),
    validate,
  }
}
