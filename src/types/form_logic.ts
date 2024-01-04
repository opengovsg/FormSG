import { Document } from 'mongoose'

import {
  BasicField,
  FormCondition,
  FormLogicBase,
  LogicConditionState,
  LogicType,
  PreventSubmitLogic,
  ShowFieldLogic,
} from '../../shared/types'

import { IFieldSchema } from './field'

export interface ICondition extends FormCondition {
  field: IFieldSchema['_id']
}

// Override ObjectId with String type since the field id passed in is in
// String form.
export interface IConditionSchema extends ICondition, Document<string> {}

export interface ILogicSchema extends FormLogicBase, Document {
  conditions: IConditionSchema[]
}
export interface IShowFieldsLogicSchema
  extends ILogicSchema,
    ShowFieldLogic,
    Document {
  logicType: LogicType.ShowFields
  conditions: IConditionSchema[]
}
export interface IPreventSubmitLogicSchema
  extends ILogicSchema,
    PreventSubmitLogic,
    Document {
  logicType: LogicType.PreventSubmit
  conditions: IConditionSchema[]
}

export type FormLogicSchema = IShowFieldsLogicSchema | IPreventSubmitLogicSchema

type LogicField = Extract<
  BasicField,
  | BasicField.Dropdown
  | BasicField.Radio
  | BasicField.YesNo
  | BasicField.Number
  | BasicField.Decimal
  | BasicField.Rating
>

type LogicAssociation<K extends LogicField, VS extends LogicConditionState> = [
  K,
  Array<VS>,
]

// Logic fields that are categorical
type CategoricalLogicField = Extract<
  BasicField,
  BasicField.Dropdown | BasicField.Radio
>
type CategoricalLogicStates =
  | LogicConditionState.Equal
  | LogicConditionState.Either
type CategoricalLogicCondition = LogicAssociation<
  CategoricalLogicField,
  CategoricalLogicStates
>

// Logic fields that are boolean
type BinaryLogicField = Extract<BasicField, BasicField.YesNo>
type BinaryLogicStates = LogicConditionState.Equal
type BinaryLogicCondition = LogicAssociation<
  BinaryLogicField,
  BinaryLogicStates
>

// Logic fields that can be numerically compared
type NumericalLogicField = Extract<
  BasicField,
  BasicField.Number | BasicField.Decimal | BasicField.Rating
>
type NumericalLogicStates =
  | LogicConditionState.Equal
  | LogicConditionState.Lte
  | LogicConditionState.Gte
type NumericalLogicCondition = LogicAssociation<
  NumericalLogicField,
  NumericalLogicStates
>

export type LogicCondition =
  | CategoricalLogicCondition
  | BinaryLogicCondition
  | NumericalLogicCondition
