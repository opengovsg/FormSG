import { IPaymentSchema } from '../../../types'

export const getPaymentProofS3ObjectPath = (
  payment: Pick<IPaymentSchema, 'formId' | '_id'>,
) => {
  return payment.formId + '/' + payment._id + '.pdf'
}
