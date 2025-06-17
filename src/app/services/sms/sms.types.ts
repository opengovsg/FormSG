import { Document, Model } from 'mongoose'

import { FormPermission } from '../../../../shared/types'
import { FormOtpData, IFormSchema, IUserSchema } from '../../../types'

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
  smsData: FormOtpData
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
   * //TODO: update this to be on the form level instead of admin level
   * Counts the number of sms which an admin has sent using default (formSG) credentials.
   * NOTE: This counts across all forms which an admin has.
   */
  retrieveSmsCounts: (formId: string) => Promise<number>
}

export interface BounceNotificationSmsParams {
  recipient: string
  recipientEmail: string
  adminId: string
  adminEmail: string
  formId: string
  formTitle: string
}
