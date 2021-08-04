import { Document } from 'mongoose'

import {
  CustomFormLogo,
  FormLogoBase,
  FormLogoState,
} from '../../shared/types/form/form_logo'

export { FormLogoState, FormLogoBase, CustomFormLogo }

export type IFormLogoSchema = FormLogoBase & Document
export type ICustomFormLogoSchema = CustomFormLogo & Document
