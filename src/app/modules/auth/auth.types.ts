import { SgidPublicOfficerEmploymentList } from 'shared/types/auth'

import { IPopulatedUser } from 'src/types'

export type SessionUser = IPopulatedUser

export type SgidSessionUser = IPopulatedUser & SgidUser

export type SgidUser = {
  profiles: SgidPublicOfficerEmploymentList
}
