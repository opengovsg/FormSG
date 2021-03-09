import { Document } from 'mongoose'

import { IFieldSchema } from './field/baseField'
import { BasicField } from './field/fieldTypes'

export enum LogicConditionState {
  Equal = 'is equals to',
  Lte = 'is less than or equal to',
  Gte = 'is more than or equal to',
  Either = 'is either',
}

export enum LogicIfValue {
  Number = 'number',
  SingleSelect = 'single-select',
  MultiSelect = 'multi-select',
}

export enum LogicType {
  ShowFields = 'showFields',
  PreventSubmit = 'preventSubmit',
}

export interface ICondition {
  field: IFieldSchema['_id']
  state: LogicConditionState
  value: string | number | string[] | number[]
  ifValueType?: LogicIfValue
}

// Override ObjectId with String type since the field id passed in is in
// String form.
export interface IConditionSchema extends ICondition, Document<string> {}

export interface ILogic {
  conditions: IConditionSchema[]
  logicType: LogicType
}

export interface ILogicSchema extends ILogic, Document {}

export interface IShowFieldsLogic extends ILogic {
  show: IFieldSchema['_id'][]
}

export interface IShowFieldsLogicSchema extends IShowFieldsLogic, Document {}

export interface IPreventSubmitLogic extends ILogic {
  preventSubmitMessage?: string
}

export interface IPreventSubmitLogicSchema
  extends IPreventSubmitLogic,
    Document {}

type LogicField = Extract<
  BasicField,
  | BasicField.Dropdown
  | BasicField.Radio
  | BasicField.YesNo
  | BasicField.Number
  | BasicField.Decimal
  | BasicField.Rating
>

type LogicValidCondition<
  F extends LogicField,
  S extends LogicConditionState
> = {
  fieldType: F
  states: Array<S>
}

export type LogicValidConditions =
  | LogicValidCondition<
      BasicField.Dropdown,
      LogicConditionState.Equal | LogicConditionState.Either
    >
  | LogicValidCondition<BasicField.YesNo, LogicConditionState.Equal>
  | LogicValidCondition<
      BasicField.Radio,
      LogicConditionState.Equal | LogicConditionState.Either
    >
  | LogicValidCondition<
      BasicField.Number,
      | LogicConditionState.Equal
      | LogicConditionState.Lte
      | LogicConditionState.Gte
    >
  | LogicValidCondition<
      BasicField.Decimal,
      | LogicConditionState.Equal
      | LogicConditionState.Lte
      | LogicConditionState.Gte
    >
  | LogicValidCondition<
      BasicField.Rating,
      | LogicConditionState.Equal
      | LogicConditionState.Lte
      | LogicConditionState.Gte
    >
