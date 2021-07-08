import { FieldBase } from './base'

export interface ImageFieldBase extends FieldBase {
  url: string
  fileMd5Hash: string
  name: string
  size: string
}
