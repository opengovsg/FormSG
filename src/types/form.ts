import { Document } from 'mongoose'

import { IFieldSchema, MyInfoAttribute } from './field'
import { ILogicSchema } from './form_logic'
import { FormLogoState } from './form_logo'
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
  paragraph: string
  estTimeTaken: number
  colorTheme: Colors
  logo: Logo
}

export type EndPage = {
  title: string
  paragraph: string
  buttonLink: string
  buttonText: string
}

export type Permission = {
  email: string
  write: boolean
}

export type Webhook = {
  url: string
}

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
  emails?: string[]
}

export interface IFormSchema extends IForm, Document {
  getMainFields(): Pick<IFormSchema, '_id' | 'title' | 'status'>
  getUniqMyinfoAttrs(): MyInfoAttribute[]
  duplicate(overrideProps: Partial<IForm>): Partial<IFormSchema>
  transferOwner(currentOwner: IUserSchema, newOwnerEmail: string): void
}

export interface IPopulatedForm extends IFormSchema {
  admin: IPopulatedUser
}

export interface IEncryptedForm extends IForm {
  publicKey: string
  emails: never
}

export type IEncryptedFormSchema = IEncryptedForm & IFormSchema

export interface IEmailForm extends IForm {
  emails: string[]
  publicKey: never
}

export type IEmailFormSchema = IEmailForm & IFormSchema
