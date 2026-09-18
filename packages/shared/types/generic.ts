import { isDate, parseISO } from 'date-fns'
import type { Opaque } from 'type-fest'
import { z } from 'zod'

export type DateString = Opaque<string, 'DateString'>

export const DateString = z.custom<DateString>().refine(
  (val) => isDate(parseISO(val)),
  (val) => ({ message: `${val} is not a valid date` }),
)
