import { Opaque } from 'type-fest'
import { z } from 'zod'

import { DateString } from '../generic'

import { AgencyId } from './agency'

type UserId = Opaque<string, 'UserId'>
type UserContact = Opaque<string, 'UserContact'>

export const User = z.object({
  _id: z.string() as unknown as z.Schema<UserId>,
  email: z.string().email(),
  agency: AgencyId,
  created: DateString,
  betaFlags: z.record(z.boolean()).optional(),
  lastAccessed: DateString,
  updatedAt: DateString,
  contact: (z.string() as unknown as z.Schema<UserContact>).optional(),
})

export type User = z.infer<typeof User>
