import { CustomFormLogo, FormLogoBase } from 'formsg-shared/types'
import { Document } from 'mongoose'

export type IFormLogoSchema = FormLogoBase & Document
export type ICustomFormLogoSchema = CustomFormLogo & Document
