import {
  AttachmentFieldBase,
  AttachmentSize,
  BasicField,
} from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { AttachmentSize, AttachmentFieldBase }
export interface IAttachmentFieldSchema
  extends AttachmentFieldBase,
    IFieldSchema {
  fieldType: BasicField.Attachment
}
