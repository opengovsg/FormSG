import { SgidPublicOfficerEmploymentList } from 'shared/types/auth'

import { IPopulatedUser } from 'src/types'

export type SessionUser = IPopulatedUser

export type SgidUser = {
  profiles: SgidPublicOfficerEmploymentList
  expiry: number
}
