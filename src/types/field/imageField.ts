import { IField, IFieldSchema } from './baseField'

export interface IImageField extends IField {
  url: string
  fileMd5Hash: string
  name: string
  size: string
}

export interface IImageFieldSchema extends IImageField, IFieldSchema {}
