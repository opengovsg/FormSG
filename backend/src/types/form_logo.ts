
import { FormLogoState, IFormLogo } from '../../../shared/types/form'
import { Document } from 'mongoose'

export { FormLogoState }

export type IFormLogoSchema = IFormLogo & Document

export interface ICustomFormLogo extends IFormLogo {
  fileId: string
  fileName: string
  fileSizeInBytes: number
}

export type ICustomFormLogoSchema = ICustomFormLogo & Document
