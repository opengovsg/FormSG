import { Document, Model } from 'mongoose'
import { Twilio } from 'twilio'

import {
  AdminContactOtpData,
  FormOtpData,
  IFormSchema,
  IUserSchema,
} from '../../../types'

export enum SmsType {
  Verification = 'VERIFICATION',
  AdminContact = 'ADMIN_CONTACT',
}

export enum LogType {
  failure = 'FAILURE',
  success = 'SUCCESS',
}

export type LogSmsParams = {
  smsData: FormOtpData | AdminContactOtpData
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
}

export interface ISmsCountSchema extends ISmsCount, Document {}

export interface IVerificationSmsCount extends ISmsCount {
  form: IFormSchema['_id']
  formAdmin: {
    email: string
    userId: IUserSchema['_id']
  }
}

export type IVerificationSmsCountSchema = ISmsCountSchema

export interface IAdminContactSmsCount extends ISmsCount {
  admin: IUserSchema['_id']
}

export type IAdminContactSmsCountSchema = ISmsCountSchema

export interface ISmsCountModel extends Model<ISmsCountSchema> {
  logSms: (logParams: LogSmsParams) => Promise<ISmsCountSchema>
}

export type TwilioCredentials = {
  accountSid: string
  apiKey: string
  apiSecret: string
  messagingServiceSid: string
}

export type TwilioConfig = {
  client: Twilio
  msgSrvcSid: string
}
