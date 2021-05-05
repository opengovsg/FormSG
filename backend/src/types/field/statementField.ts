import { IFieldSchema } from './baseField'
import { IStatementField } from './fieldTypes'

export interface IStatementFieldSchema extends IStatementField, IFieldSchema {}
