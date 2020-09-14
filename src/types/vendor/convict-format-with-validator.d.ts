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
}
