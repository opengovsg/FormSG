import { Document } from 'mongoose'

import { CustomFormLogo, FormLogoBase } from '../../shared/types'

export type IFormLogoSchema = FormLogoBase & Document
export type ICustomFormLogoSchema = CustomFormLogo & Document
