import { AttachmentFieldBase, BasicField } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IAttachmentFieldSchema
  extends AttachmentFieldBase, IFieldSchema {
  fieldType: BasicField.Attachment
}
