import { isDate, parseISO } from 'date-fns'
import { Opaque } from 'type-fest'
import { z } from 'zod'

import { Agency } from './agency'

type UserId = Opaque<string, 'UserId'>
type UserContact = Opaque<string, 'UserContact'>

const DateString = z.string().refine(
  (val) => isDate(parseISO(val)),
  (val) => ({ message: `${val} is not a valid date` }),
)

export const User = z.object({
  _id: z.string() as unknown as z.Schema<UserId>,
  email: z.string().email(),
  agency: Agency,
  betaFlags: z.record(z.boolean()).optional(),
  created: DateString,
  lastAccessed: DateString,
  updatedAt: DateString,
  contact: (z.string() as unknown as z.Schema<UserContact>).optional(),
})

export type User = z.infer<typeof User>
