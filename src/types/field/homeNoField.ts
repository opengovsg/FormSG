import { HomenoFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export type IHomenoField = HomenoFieldBase

export interface IHomenoFieldSchema extends IHomenoField, IFieldSchema {}
