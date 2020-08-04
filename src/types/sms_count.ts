import { Document } from 'mongoose'

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
  form: IFormSchema['_id']
  formAdmin: {
    email: string
    userId: IUserSchema['_id']
  }
  // The Twilio SID used to send the SMS. Not to be confused with msgSrvcName.
  msgSrvcSid: string
  logType: LogType
  smsType: SmsType
  createdAt?: Date
  _id: any
}

export interface ISmsCountSchema extends ISmsCount, Document {}
