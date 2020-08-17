import { Document, Model } from 'mongoose'

import { IFormSchema, OtpData } from './form'
import { IUserSchema } from './user'

export enum SmsType {
  verification = 'VERIFICATION',
}

export enum LogType {
  failure = 'FAILURE',
  success = 'SUCCESS',
}

export type LogSmsParams = {
  otpData: OtpData
  msgSrvcSid: string
  smsType: SmsType
  logType: LogType
}

export interface ISmsCount {
  // The Twilio SID used to send the SMS. Not to be confused with msgSrvcName.
  msgSrvcSid: string
  logType: LogType
  smsType: SmsType
  createdAt?: Date
  _id: Document['_id']
}

export interface ISmsCountSchema extends ISmsCount, Document {}

export interface IVerificationSmsCount extends ISmsCount {
  form: IFormSchema['_id']
  formAdmin: {
    email: string
    userId: IUserSchema['_id']
  }
}

export interface IVerificationSmsCountSchema extends ISmsCountSchema {}

export interface ISmsCountModel extends Model<ISmsCountSchema> {
  logSms: (logParams: LogSmsParams) => Promise<ISmsCountSchema>
}
