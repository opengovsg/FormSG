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
  const dateRangePair = dateRangeString.split(' ')

  if (dateRangePair.length !== 2)
    throw new Error(`Date range string ${dateRangeString} does not split in 2`)

  const [mthstring, yrstring] = dateRangePair

  return {
    yr: parseInt(yrstring),
    mth: MTH_TO_STRING.findIndex((mth) => mth === mthstring),
  }
}
