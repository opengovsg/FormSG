import { Opaque } from 'type-fest'
import { z } from 'zod'

export type AgencyId = Opaque<string, 'AgencyId'>
export const AgencyId = z.string() as unknown as z.Schema<AgencyId>

export const AgencyDocument = z.object({
  _id: AgencyId,
  emailDomain: z.array(z.string()),
  fullName: z.string(),
  shortName: z.string(),
  logo: z.string(),
  created: z.date(),
  lastModified: z.date(),
})

export type AgencyDocument = z.infer<typeof AgencyDocument>
