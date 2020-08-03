import { Document } from 'mongoose'

import { IFieldSchema } from './field/baseField'

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

export interface IConditionSchema extends ICondition, Document {
  // Override ObjectId with String type since the field id passed in is in
  // String form.
  _id: string
}

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
