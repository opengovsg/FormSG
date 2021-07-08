import { NricFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export type INricField = NricFieldBase

export interface INricFieldSchema extends INricField, IFieldSchema {}
