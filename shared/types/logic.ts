import {
  AllowMyInfoBase,
  FieldBase,
  FieldResponse,
  FormDto,
  FormCondition,
} from '../types'

export type PickLogicSubset<T extends FormDto = FormDto> = Pick<
  T,
  '_id' | 'form_logics' | 'form_fields' | 'responseMode'
>

export type FieldIdSet = Set<string>

export interface ClientField extends AllowMyInfoBase, FieldBase {
  _id?: string
  fieldValue: string
}

export type LogicFieldOrResponse = ClientField | FieldResponse
export type GroupedLogic = Record<string, FormCondition[][]>
