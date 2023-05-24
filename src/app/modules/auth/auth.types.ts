import { IPopulatedUser } from 'src/types'

export type SessionUser = IPopulatedUser

export interface ApiReqBody {
  formSg?: {
    userId?: string
  }
}
