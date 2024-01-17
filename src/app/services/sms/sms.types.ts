import { Document, Model } from 'mongoose'
import { Twilio } from 'twilio'

import { FormPermission } from '../../../../shared/types'
import {
  AdminContactOtpData,
  FormOtpData,
  IFormSchema,
  IUserSchema,
} from '../../../types'

export enum SmsType {
  Verification = 'VERIFICATION',
  AdminContact = 'ADMIN_CONTACT',
  DeactivatedForm = 'DEACTIVATED_FORM',
  BouncedSubmission = 'BOUNCED_SUBMISSION',
}

export enum LogType {
  failure = 'FAILURE',
  success = 'SUCCESS',
}

export type FormDeactivatedSmsData = {
  form: IFormSchema['_id']
  formAdmin: {
    email: IUserSchema['email']
    userId: IUserSchema['_id']
  }
  collaboratorEmail: FormPermission['email']
  recipientNumber: string
}

export type BouncedSubmissionSmsData = FormDeactivatedSmsData

export type LogSmsParams = {
  smsData:
    | FormOtpData
    | AdminContactOtpData
    | FormDeactivatedSmsData
    | BouncedSubmissionSmsData
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
  isOnboardedAccount: boolean
}

export interface IVerificationSmsCountSchema
  extends IVerificationSmsCount,
    ISmsCountSchema {
  isOnboardedAccount: boolean
}

export interface IAdminContactSmsCount extends ISmsCount {
  admin: IUserSchema['_id']
}

export interface IAdminContactSmsCountSchema
  extends IAdminContactSmsCount,
    ISmsCountSchema {}

export interface IFormDeactivatedSmsCount
  extends ISmsCount,
    FormDeactivatedSmsData {}

export interface IFormDeactivatedSmsCountSchema
  extends ISmsCountSchema,
    FormDeactivatedSmsData {}

export interface IBouncedSubmissionSmsCount
  extends ISmsCount,
    BouncedSubmissionSmsData {}

export interface IBouncedSubmissionSmsCountSchema
  extends ISmsCountSchema,
    BouncedSubmissionSmsData {}

export interface ISmsCountModel extends Model<ISmsCountSchema> {
  logSms: (logParams: LogSmsParams) => Promise<ISmsCountSchema>
  /**
   * Counts the number of sms which an admin has sent using default (formSG) credentials.
   * NOTE: This counts across all forms which an admin has.
   */
  retrieveFreeSmsCounts: (userId: string) => Promise<number>
}

export type TwilioCredentials = {
  accountSid: string
  apiKey: string
  apiSecret: string
  messagingServiceSid: string
}

export class TwilioCredentialsData {
  accountSid: string
  apiKey: string
  apiSecret: string
  messagingServiceSid: string

  constructor(twilioCredentials: TwilioCredentials) {
    const { accountSid, apiKey, apiSecret, messagingServiceSid } =
      twilioCredentials

    this.accountSid = accountSid
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.messagingServiceSid = messagingServiceSid
  }

  static fromString(credentials: string): TwilioCredentials | unknown {
    try {
      const twilioCredentials: TwilioCredentials = JSON.parse(credentials)
      return new TwilioCredentialsData(twilioCredentials)
    } catch (err) {
      return err
    }
  }

  toString(): string {
    const body: TwilioCredentials = {
      accountSid: this.accountSid,
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      messagingServiceSid: this.messagingServiceSid,
    }
    return JSON.stringify(body)
  }
}

export type TwilioConfig = {
  client: InstanceType<typeof Twilio>
  msgSrvcSid: string
}

export interface BounceNotificationSmsParams {
  recipient: string
  recipientEmail: string
  adminId: string
  adminEmail: string
  formId: string
  formTitle: string
}
