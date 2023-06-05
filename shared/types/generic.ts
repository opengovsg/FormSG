import type { Opaque } from 'type-fest'
import { z } from 'zod'
import { isDate, parseISO } from 'date-fns'

export type DateString = Opaque<string, 'DateString'>

export const DateString = z.custom<DateString>().refine(
  (val) => isDate(parseISO(val)),
  (val) => ({ message: `${val} is not a valid date` }),
)
