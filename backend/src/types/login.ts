import { Document, Model } from 'mongoose'

import { LoginStatistic } from '../../../shared/types/billing'
import { IAgencySchema } from './agency'
import { AuthType, IFormSchema, IPopulatedForm } from './form'
import { IUserSchema } from './user'

export interface ILogin {
  admin: IUserSchema['_id']
  form: IFormSchema['_id']
  agency: IAgencySchema['_id']
  authType: AuthType
  esrvcId: string
  created?: Date
}

export interface ILoginSchema extends ILogin, Document {}

export { LoginStatistic }

export interface ILoginModel extends Model<ILoginSchema> {
  aggregateLoginStats: (
    esrvcId: string,
    gte: Date,
    lte: Date,
  ) => Promise<LoginStatistic[]>
  addLoginFromForm: (form: IPopulatedForm) => Promise<ILoginSchema>
}
