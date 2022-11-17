export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export type Payment = {
  submissionId: string
  amount: number
  status: PaymentStatus
  webhookLog: string[]
  paymentIntentId: string
  payoutId: string
  payoutDate: string
}
