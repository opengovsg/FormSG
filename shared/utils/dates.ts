import { format, parse } from 'date-fns'
import { MYINFO_DATE_FORMAT, DATE_PARSE_FORMAT } from '../constants'

export const formatMyinfoDate = (value: string) => {
  return format(parse(value, MYINFO_DATE_FORMAT, new Date()), DATE_PARSE_FORMAT)
}
