import { Document, LeanDocument } from 'mongoose'
import { ConditionalPick, Primitive } from 'type-fest'

import { IClientFieldSchema, IFieldSchema } from './field/baseField'
import { FieldResponse } from './response'

import {
  LogicConditionState,
  IShowFieldsLogic as ISharedShowFieldsLogic,
  IPreventSubmitLogic as ISharedPreventSubmitLogic,
  LogicCondition,
  LogicIfValue,
  LogicType,
  LogicWithId,
  ICondition as ISharedCondition,
  ILogic as ISharedLogic,
} from '../../../shared/types/form/logic'

export { LogicDto } from '../../../shared/types/api/logic'

export {
  LogicConditionState,
  LogicIfValue,
  LogicType,
  LogicWithId,
  LogicCondition,
}

export interface ICondition extends ISharedCondition {
  // Replace with schema id
  field: IFieldSchema['_id']
}

// Override ObjectId with String type since the field id passed in is in
// String form.
export interface IConditionSchema extends ICondition, Document<string> {}

export interface ILogic extends ISharedLogic {
  // Replace with condition schema instead of POJO.
  conditions: IConditionSchema[]
}

export interface ILogicSchema extends ILogic, Document {
  _id: NonNullable<Document['_id']>
}

export interface IShowFieldsLogic extends ISharedShowFieldsLogic, ILogic {
  conditions: IConditionSchema[]
  // Replace with condition schema array instead of POJO array.
  show: IFieldSchema['_id'][]
}

export interface IPreventSubmitLogic extends ISharedPreventSubmitLogic, ILogic {
  conditions: IConditionSchema[]
}

export interface IShowFieldsLogicSchema extends IShowFieldsLogic, Document {
  _id: NonNullable<Document['_id']>
}

export interface IPreventSubmitLogicSchema
  extends IPreventSubmitLogic,
    Document {
  _id: NonNullable<Document['_id']>
}

export type GroupedLogic = Record<string, IConditionSchema[][]>
export type FieldIdSet = Set<IClientFieldSchema['_id']>
export type LogicFieldSchemaOrResponse = IClientFieldSchema | FieldResponse
