import { IVerificationSchema } from '../../../types'

export interface ITransaction {
  transactionId: IVerificationSchema['_id']
  expireAt: IVerificationSchema['expireAt']
}
