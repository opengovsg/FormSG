export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export type Payment = {
  submissionId: string
  amount: number
  status: PaymentStatus
  webhookLog: Record<string, any>[]
  paymentIntentId: string
  payoutId: string
  payoutDate: string
}
