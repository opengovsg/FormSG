declare module 'libphonenumber-js/examples.mobile.json' {
  import { CountryCode, NationalNumber } from 'libphonenumber-js'

  const defaultExport: { [country in CountryCode]: NationalNumber }
  export default defaultExport
}
