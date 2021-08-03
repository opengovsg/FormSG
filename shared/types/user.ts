import { z } from 'zod'
import { Opaque } from 'type-fest'

import { DateString } from './generic'
import { AgencyBase, AgencyDto } from './agency'

type UserId = Opaque<string, 'UserId'>
type UserContact = Opaque<string, 'UserContact'>

// Base used for being referenced by schema/model in the backend.
// Note the lack of typing of _id.
export const UserBase = z.object({
  _id: z.unknown(),
  email: z.string().email(),
  agency: AgencyBase.shape._id,
  betaFlags: z.record(z.boolean()).optional(),
  created: z.date(),
  lastAccessed: z.date().optional(),
  updatedAt: z.date(),
  contact: (z.string() as unknown as z.Schema<UserContact>).optional(),
})
export type UserBase = z.infer<typeof UserBase>

// Convert to serialized versions.
export const UserDto = UserBase.extend({
  _id: z.string() as unknown as z.Schema<UserId>,
  agency: AgencyDto.extend({
    created: DateString,
    lastModified: DateString,
  }),
  created: DateString,
  lastAccessed: DateString.optional(),
  updatedAt: DateString,
})
export type UserDto = z.infer<typeof UserDto>
