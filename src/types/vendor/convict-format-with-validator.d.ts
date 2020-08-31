declare module 'convict-format-with-validator' {
  function coerce(v): string
  function validate(x): void

  const url = {
    name: 'url' as const,
    coerce,
    validate,
  }

  const ipaddress = {
    name: 'ipaddress' as const,
    coerce,
    validate,
  }

  const email = {
    name: 'email' as const,
    coerce,
    validate,
  }

  export default {
    url,
    ipaddress,
    email,
  }
}
