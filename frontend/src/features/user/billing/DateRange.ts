export type DateRange = {
  yr: number
  mth: number
}

const MTH_TO_STRING = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const dateRangeToString = ({ yr, mth }: DateRange): string =>
  MTH_TO_STRING[mth] + ' ' + yr.toString()

export const stringToDateRange = (dateRangeString: string): DateRange => {
  const matches = dateRangeString.match(/^([a-z]+) ([12]\d{3})$/i)

  if (!matches)
    throw new Error(
      `Date range string [${dateRangeString}] does not have a valid format`,
    )

  const [, mthstring, yrstring] = matches
  const mth = MTH_TO_STRING.findIndex((mth) => mth === mthstring)

  if (mth === -1)
    throw new Error(
      `Date range string [${dateRangeString}] does not have a valid month string`,
    )

  return { mth, yr: parseInt(yrstring) }
}
