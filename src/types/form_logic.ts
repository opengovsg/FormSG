import { Document } from 'mongoose'

import { IClientFieldSchema, IFieldSchema } from './field/baseField'
import { BasicField } from './field/fieldTypes'
import {
  FieldResponse,
  IAttachmentResponse,
  ICheckboxResponse,
  ISingleAnswerResponse,
  ITableResponse,
} from '.'

export enum LogicConditionState {
  Equal = 'is equals to',
  Lte = 'is less than or equal to',
  Gte = 'is more than or equal to',
  Either = 'is either',
  AnyOf = 'is one of the following',
}

export enum LogicIfValue {
  Number = 'number',
  SingleSelect = 'single-select',
  MultiSelect = 'multi-select',
  MultiValue = 'multi-value',
}

export enum LogicType {
  ShowFields = 'showFields',
  PreventSubmit = 'preventSubmit',
}

export interface ICondition {
  field: IFieldSchema['_id']
  state: LogicConditionState
  value:
    | string
    | number
    | string[]
    | number[]
    | CheckboxConditionValue[]
    | ClientCheckboxConditionOption[][] // frontend representation of checkbox condition value, will not be added to backend (ensured by Joi validators)
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
  | BasicField.Checkbox
>

type LogicAssociation<K extends LogicField, VS extends LogicConditionState> = [
  K,
  Array<VS>,
]

// Logic fields that are multi-valued
type MultiValuedLogicField = Extract<BasicField, BasicField.Checkbox>
type MultiValuedLogicStates = LogicConditionState.AnyOf
type MultiValuedLogicCondition = LogicAssociation<
  MultiValuedLogicField,
  MultiValuedLogicStates
>

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
  | MultiValuedLogicCondition

/**
 * Types for checkbox logic field
 */
// Representation of an option in the logic tab
export type ClientCheckboxConditionOption = {
  value: string
  other: boolean
}

// Representation of frontend checkbox response after being transformed
export type ClientLogicCheckboxResponse = Omit<
  IClientFieldSchema,
  'fieldValue'
> & {
  fieldValue: CheckboxConditionValue
}

// Representation of backend checkbox response after being transformed
export type ILogicCheckboxResponse = Omit<ICheckboxResponse, 'answerArray'> & {
  answerArray: CheckboxConditionValue
}
// Representation of a Checkbox condition
export interface LogicCheckboxCondition
  extends Omit<IConditionSchema, 'value'> {
  value: CheckboxConditionValue[]
}
// Representation of a checkbox condition value
export type CheckboxConditionValue = {
  options: string[]
  others: boolean
}

// Types for condition values of fields that have to be transformed before inserting into logic module
export type ConditionValueTypes = CheckboxConditionValue

/**
 * Logic POJO with functions removed
 */
export type LogicDto = ILogic & { _id?: Document['_id'] }

/**
 * Types needed for logic module inputs
 */
// Type for fields before being transformed and passed into the logic module
export type FieldSchemaOrResponse = IClientFieldSchema | FieldResponse

// Type for client fields after being transformed and passed into the logic module
export type ILogicClientFieldSchema =
  | IClientFieldSchema
  | ClientLogicCheckboxResponse

// Type for backend fields after being transformed and passed into the logic module
export type LogicFieldResponse =
  | ISingleAnswerResponse
  | ILogicCheckboxResponse
  | ITableResponse
  | IAttachmentResponse
