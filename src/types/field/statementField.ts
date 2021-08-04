import { BasicField, StatementFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { StatementFieldBase }
export interface IStatementFieldSchema
  extends StatementFieldBase,
    IFieldSchema {
  fieldType: BasicField.Statement
}
