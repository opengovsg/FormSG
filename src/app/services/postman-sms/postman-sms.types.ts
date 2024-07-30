import { FormPermission } from '../../../../shared/types'
import { IFormSchema, IUserSchema } from '../../../types'

export enum SmsType {
  Verification = 'VERIFICATION',
  AdminContact = 'ADMIN_CONTACT',
  DeactivatedForm = 'DEACTIVATED_FORM',
  BouncedSubmission = 'BOUNCED_SUBMISSION',
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
