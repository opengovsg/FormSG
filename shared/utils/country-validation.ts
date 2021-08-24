import myInfoCountries from '../constants/field/myinfo/myinfo-countries'

const countries = new Set(myInfoCountries)

export const isCountryValid = (country: string): boolean => {
  return countries.has(country)
}
