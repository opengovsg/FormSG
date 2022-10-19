import { Document, Model } from 'mongoose'
import type { Merge } from 'type-fest'

import {
  FormBillingStatistic as SharedFormBillingStatistic,
  LoginBase,
} from '../../shared/types'

import { IAgencySchema } from './agency'
import { IFormSchema, IPopulatedForm } from './form'
import { IUserSchema } from './user'

interface ILogin extends LoginBase {
  admin: IUserSchema['_id']
  form: IFormSchema['_id']
  agency: IAgencySchema['_id']
}

export type FormBillingStatistic = Merge<
  SharedFormBillingStatistic,
  { formId: ILogin['form'] }
>

export interface ILoginSchema extends ILogin, Document {
  created?: Date
}

export interface ILoginModel extends Model<ILoginSchema> {
  aggregateLoginStats: (
    esrvcId: string,
    gte: Date,
    lte: Date,
  ) => Promise<FormBillingStatistic[]>
  addLoginFromForm: (form: IPopulatedForm) => Promise<ILoginSchema>
}
