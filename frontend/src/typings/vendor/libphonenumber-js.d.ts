declare module 'libphonenumber-js/examples.mobile.json' {
  import { CountryCode } from 'libphonenumber-js'

  const defaultExport: { [country in CountryCode]: string }
  export default defaultExport
}

declare module '~components/PhoneNumberInput/resources/examples.landline.json' {
  import { CountryCode } from 'libphonenumber-js'

  const defaultExport: { [country in CountryCode]: string }
  export default defaultExport
}
