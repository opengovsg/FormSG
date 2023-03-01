import { Model } from 'mongoose'

import { Payment } from '../../shared/types/payment'

export type IPaymentSchema = Payment

export interface IPaymentModel extends Model<IPaymentSchema> {
  findBySubmissionId(submissionId: string): Promise<IPaymentSchema | null>
}
