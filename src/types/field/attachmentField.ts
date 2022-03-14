import { AttachmentFieldBase, BasicField } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IAttachmentFieldSchema
  extends AttachmentFieldBase,
    IFieldSchema {
  fieldType: BasicField.Attachment
}
