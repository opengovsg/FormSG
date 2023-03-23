import { Document, Model } from 'mongoose'

import { Payment } from '../../shared/types/payment'

export interface IPaymentSchema extends Payment, Document {}

export interface IPaymentModel extends Model<IPaymentSchema> {
  findBySubmissionId(submissionId: string): Promise<IPaymentSchema | null>
}
