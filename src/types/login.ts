import { Aggregate, Document, Model } from 'mongoose'

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
  _id: Document['_id']
}

export interface ILoginSchema extends ILogin, Document {}

export type LoginStatistic = {
  adminEmail: IUserSchema['email']
  formName: IFormSchema['title']
  total: number
  formId: IFormSchema['_id']
  authType: ILoginSchema['authType']
}

export interface ILoginModel extends Model<ILoginSchema> {
  aggregateLoginStats: (
    esrvcId: string,
    gte: Date,
    lte: Date,
  ) => Promise<LoginStatistic[]>
}
