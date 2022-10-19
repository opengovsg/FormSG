import type { Opaque } from 'type-fest'
import { z } from 'zod'
import { DateString } from './generic'

export type AgencyId = Opaque<string, 'AgencyId'>
export const AgencyId = z.string() as unknown as z.Schema<AgencyId>

// Base used for being referenced by schema/model in the backend.
// Note the lack of typing of _id.
export const AgencyBase = z.object({
  _id: z.unknown(),
  emailDomain: z.array(z.string()),
  fullName: z.string(),
  shortName: z.string(),
  logo: z.string(),
})
export type AgencyBase = z.infer<typeof AgencyBase>

export const AgencyDto = AgencyBase.extend({
  _id: AgencyId,
  created: DateString,
  lastModified: DateString,
})
export type AgencyDto = z.infer<typeof AgencyDto>

export const PublicAgencyDto = AgencyDto.pick({
  shortName: true,
  fullName: true,
  emailDomain: true,
  logo: true,
})
export type PublicAgencyDto = z.infer<typeof PublicAgencyDto>
