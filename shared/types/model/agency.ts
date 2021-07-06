import { Opaque } from 'type-fest'
import { z } from 'zod'

import { DateString } from '../generic'

export type AgencyId = Opaque<string, 'AgencyId'>
export const AgencyId = z.string() as unknown as z.Schema<AgencyId>

export const Agency = z.object({
  _id: AgencyId,
  emailDomain: z.array(z.string()),
  fullName: z.string(),
  shortName: z.string(),
  logo: z.string(),
  created: DateString,
  lastModified: DateString,
})

export type Agency = z.infer<typeof Agency>
