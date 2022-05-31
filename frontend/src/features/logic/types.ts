import { BasicField, FormFieldDto } from '~shared/types/field'
import { FormCondition } from '~shared/types/form'

type FieldId = FormFieldDto['_id']

export type FieldIdSet = Set<FieldId>
export type FieldIdToType = Record<FieldId, BasicField>

export type GroupedLogicMeta = {
  groupedLogic: Record<FieldId, FormCondition[][]>
  hasInvalidLogic: boolean
}
