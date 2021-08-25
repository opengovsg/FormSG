import { BasicField, StatementFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IStatementFieldSchema
  extends StatementFieldBase,
    IFieldSchema {
  fieldType: BasicField.Statement
}
