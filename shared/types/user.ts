import { z } from 'zod'
import { Opaque } from 'type-fest'

import { DateString } from './generic'
import { AgencyDocument, AgencyId } from './agency'

type UserId = Opaque<string, 'UserId'>
type UserContact = Opaque<string, 'UserContact'>

export const UserDocument = z.object({
  _id: z.string() as unknown as z.Schema<UserId>,
  email: z.string().email(),
  agency: AgencyId,
  betaFlags: z.record(z.boolean()).optional(),
  created: z.date(),
  lastAccessed: z.date().optional(),
  updatedAt: z.date(),
  contact: (z.string() as unknown as z.Schema<UserContact>).optional(),
})
export type UserDocument = z.infer<typeof UserDocument>

// Convert to serialized versions.
export const UserDto = UserDocument.extend({
  agency: AgencyDocument.extend({
    created: DateString,
    lastModified: DateString,
  }),
  created: DateString,
  lastAccessed: DateString.optional(),
  updatedAt: DateString,
})
export type UserDto = z.infer<typeof UserDto>
