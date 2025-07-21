import { format, parse } from 'date-fns'
import { MYINFO_DATE_FORMAT, DATE_PARSE_FORMAT } from '../constants'

export const formatMyinfoDate = (value: string) => {
  return format(parse(value, MYINFO_DATE_FORMAT, new Date()), DATE_PARSE_FORMAT)
}

export const formatSgDate = (value: string) => {
  const sgDate = new Date(new Date(value).getTime() + 8 * 60 * 60 * 1000)
  return sgDate.toISOString().slice(0, 19).replace('T', ' ')
}
