import { IFieldSchema } from './baseField'
import { IAttachmentField } from './fieldTypes'

export interface IAttachmentFieldSchema
  extends IAttachmentField,
    IFieldSchema {}
