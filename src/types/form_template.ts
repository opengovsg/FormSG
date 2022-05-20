import { Model } from 'mongoose'
import {
  FormTemplateBase,
  FormTemplateDto,
} from 'shared/types/form/form_template'

export type IFormTemplateSchema = FormTemplateBase

export interface IFormTemplateModel extends Model<IFormTemplateSchema> {
  getFormTemplates(): Promise<FormTemplateDto[]>
}
