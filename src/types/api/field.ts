import { EditFieldActions } from '../../shared/constants'
import { IFieldSchema } from '../field'

export type EditFormFieldParams = {
  field: IFieldSchema
} & (
  | {
      action: {
        name: Exclude<EditFieldActions, EditFieldActions.Reorder>
      }
    }
  | {
      action: {
        name: EditFieldActions.Reorder
        position: number
      }
    }
)
