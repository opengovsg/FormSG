import { Opaque } from 'type-fest'
import { z } from 'zod'

type AgencyId = Opaque<string, 'AgencyId'>

export const Agency = z.object({
  emailDomain: z.array(z.string()),
  fullName: z.string(),
  shortName: z.string(),
  logo: z.string(),
  _id: z.string() as unknown as z.Schema<AgencyId>,
})

export type Agency = z.infer<typeof Agency>
