import { StatementFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export type IStatementField = StatementFieldBase
export interface IStatementFieldSchema extends IStatementField, IFieldSchema {}
