import { Document, Model } from 'mongoose'
import { Merge } from 'type-fest'

import { OverrideProps } from '../app/modules/form/admin-form/admin-form.types'

import { IFieldSchema, MyInfoAttribute } from './field'
import { ILogicSchema } from './form_logic'
import { FormLogoState, IFormLogo } from './form_logo'
import { IPopulatedUser, IUserSchema } from './user'

export enum AuthType {
  NIL = 'NIL',
  SP = 'SP',
  CP = 'CP',
}

export enum Status {
  Private = 'PRIVATE',
  Public = 'PUBLIC',
  Archived = 'ARCHIVED',
}

export enum Colors {
  Blue = 'blue',
  Red = 'red',
  Green = 'green',
  Orange = 'orange',
  Brown = 'brown',
  Grey = 'grey',
}

export enum ResponseMode {
  Encrypt = 'encrypt',
  Email = 'email',
}

// Typings
export type FormOtpData = {
  form: IFormSchema['_id']
  formAdmin: {
    email: IUserSchema['email']
    userId: IUserSchema['_id']
  }
  // Used for sending with the correct twilio
  msgSrvcName?: string
}

export type Logo = {
  state: FormLogoState
}

export type StartPage = {
  paragraph?: string
  estTimeTaken?: number
  colorTheme?: Colors
  logo?: IFormLogo
}

export type EndPage = {
  title?: string
  paragraph?: string
  buttonLink?: string
  buttonText?: string
}

export type Permission = {
  email: string
  write: boolean
}

export type Webhook = {
  url: string
}

/**
 * Typing for duplicate form with specific keys.
 */
export type PickDuplicateForm = Pick<
  IFormSchema,
  | 'form_fields'
  | 'form_logics'
  | 'startPage'
  | 'endPage'
  | 'authType'
  | 'inactiveMessage'
  | 'responseMode'
>
export interface IForm {
  title: string
  form_fields?: IFieldSchema[]
  form_logics?: ILogicSchema[]
  admin: IUserSchema['_id']
  permissionList?: Permission[]

  startPage?: StartPage
  endPage?: EndPage

  hasCaptcha?: boolean
  authType?: AuthType

  customLogo?: string
  status?: Status

  inactiveMessage?: string
  isListed?: boolean
  esrvcId?: string
  webhook?: Webhook
  msgSrvcName?: string

  responseMode: ResponseMode

  // Schema properties
  _id: Document['_id']
  created?: Date
  lastModified?: Date

  publicKey?: string
  // string type is allowed due to a setter on the form schema that transforms
  // strings to string array.
  emails?: string[] | string
}

export interface IFormSchema extends IForm, Document {
  /**
   * Returns the dashboard form view of the form.
   * @param admin the admin to inject into the returned object
   * @returns dashboard form view object
   */
  getDashboardView(admin: IPopulatedUser): DashboardFormView
  getUniqueMyInfoAttrs(): MyInfoAttribute[]
  /**
   * Archives form.
   * @returns form that has been archived
   */
  archive(): Promise<IFormSchema>
  /**
   * Return essential form creation parameters with the given properties.
   * @param overrideProps the props to override on the duplicated form
   * @returns params required to create a new duplicated form object
   */
  getDuplicateParams(
    overrideProps: OverrideProps,
  ): PickDuplicateForm & OverrideProps
  transferOwner(currentOwner: IUserSchema, newOwnerEmail: string): void
}

export interface IPopulatedForm extends IFormSchema {
  // Remove extraneous keys that the populated form should not require.
  admin: Merge<
    Omit<
      IPopulatedUser,
      '__v' | 'created' | 'lastModified' | 'updatedAt' | 'lastAccessed'
    >,
    {
      agency: Omit<
        IPopulatedUser['agency'],
        '__v' | 'created' | 'lastModified' | 'updatedAt'
      >
    }
  >
}

export interface IEncryptedForm extends IForm {
  publicKey: string
  emails: never
}

export type IEncryptedFormSchema = IEncryptedForm & IFormSchema

export interface IEmailForm extends IForm {
  // string type is allowed due to a setter on the form schema that transforms
  // strings to string array.
  emails: string[] | string
  publicKey: never
}

export type IEmailFormSchema = IEmailForm & IFormSchema

export interface IFormModel extends Model<IFormSchema> {
  getOtpData(formId: string): Promise<FormOtpData | null>
  getFullFormById(formId: string): Promise<IPopulatedForm | null>
  deactivateById(formId: string): Promise<IFormSchema | null>
  getDashboardForms(
    userId: IUserSchema['_id'],
    userEmail: IUserSchema['email'],
  ): Promise<DashboardFormView[]>
}

export type IEncryptedFormModel = Model<IEncryptedFormSchema> & IFormModel
export type IEmailFormModel = Model<IEmailFormSchema> & IFormModel
// Typing for the shape of the form document subset that is returned to the
// frontend when admin lists their available forms in their dashboard.
export type DashboardFormView = Pick<
  IFormSchema,
  'title' | 'lastModified' | 'status' | '_id' | 'responseMode'
> & {
  admin: IPopulatedUser
}
