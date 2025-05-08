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
   * RATIONALE: Required for env vars which can be potentially undefined so that the default convict schema fallback is used
   * but also passed via SSM parameter which does not support undefined values.
   * Hence, a placeholder string representing undefined is used to evaluate to the default fallback.
   */
  const UNDEFINED_PLACEHOLDER_STRING = '__UNDEFINED__'
  export const possiblyUndefinedString = {
    name: 'possiblyUndefinedString' as const,
    coerce: (v) => (v === UNDEFINED_PLACEHOLDER_STRING ? undefined : v),
    validate,
  }
}
