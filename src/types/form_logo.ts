import { Document } from 'mongoose'

export enum FormLogoState {
  Default = 'DEFAULT',
  None = 'NONE',
  Custom = 'CUSTOM',
}

export interface IFormLogo {
  state: FormLogoState
}

export type IFormLogoSchema = IFormLogo & Document

export interface ICustomFormLogo extends IFormLogo {
  state: FormLogoState.Custom
  fileId: string
  fileName: string
  fileSizeInBytes: number
}

export type ICustomFormLogoSchema = ICustomFormLogo & Document
