import { BasicField, StatementFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IStatementFieldSchema
  extends StatementFieldBase, IFieldSchema {
  fieldType: BasicField.Statement
}
