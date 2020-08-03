import { Document } from 'mongoose'

import { IAgencySchema } from './agency'
import { AuthType, IFormSchema } from './form'
import { IUserSchema } from './user'

export interface ILogin {
  admin: IUserSchema['_id']
  form: IFormSchema['_id']
  agency: IAgencySchema['_id']
  authType: AuthType
  esrvcId: string
  created: Date
}

export interface ILoginSchema extends ILogin, Document {}
