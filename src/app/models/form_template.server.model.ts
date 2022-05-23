import { Mongoose, Schema } from 'mongoose'
import { FormTemplateDto } from 'shared/types/form/form_template'

import {
  IFormTemplateModel,
  IFormTemplateSchema,
} from 'src/types/form_template'

export const FORM_TEMPLATE_SCHEMA_ID = 'FormTemplate'

const getFormTemplateModel = (db: Mongoose): IFormTemplateModel => {
  try {
    return db.model(FORM_TEMPLATE_SCHEMA_ID) as IFormTemplateModel
  } catch {
    const FormTemplateSchema = new Schema<
      IFormTemplateSchema,
      IFormTemplateModel
    >({})
    FormTemplateSchema.statics.getFormTemplates = async function (): Promise<
      FormTemplateDto[]
    > {
      return this.find({}).lean().exec()
    }

    return db.model<IFormTemplateSchema, IFormTemplateModel>(
      FORM_TEMPLATE_SCHEMA_ID,
      FormTemplateSchema,
    )
  }
}

export default getFormTemplateModel
