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
  created: DateString,
  betaFlags: z.record(z.boolean()).optional(),
  lastAccessed: DateString,
  updatedAt: DateString,
  contact: (z.string() as unknown as z.Schema<UserContact>).optional(),
})
export type UserDocument = z.infer<typeof UserDocument>

export const UserDto = UserDocument.extend({
  agency: AgencyDocument,
})
export type UserDto = z.infer<typeof UserDto>
