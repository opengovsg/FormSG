import { BasicField, FormFieldDto } from '../field'

export enum LogicConditionState {
  Equal = 'is equals to',
  Lte = 'is less than or equal to',
  Gte = 'is more than or equal to',
  Either = 'is either',
}

export enum LogicType {
  ShowFields = 'showFields',
  PreventSubmit = 'preventSubmit',
}

export enum LogicIfValue {
  Number = 'number',
  SingleSelect = 'single-select',
  MultiSelect = 'multi-select',
}

export type FormCondition = {
  field: FormFieldDto['_id']
  state: LogicConditionState
  value: string | number | string[] | number[]
  ifValueType?: LogicIfValue
}

export type FormLogicBase = {
  logicType: LogicType
  conditions: FormCondition[]
}

export interface ShowFieldLogic extends FormLogicBase {
  logicType: LogicType.ShowFields
  show: FormFieldDto['_id'][]
}

export interface PreventSubmitLogic extends FormLogicBase {
  logicType: LogicType.PreventSubmit
  preventSubmitMessage: string
}

export type FormLogic = ShowFieldLogic | PreventSubmitLogic

export type ShowFieldLogicDto = ShowFieldLogic & { _id: string }
export type PreventSubmitLogicDto = PreventSubmitLogic & { _id: string }

export type LogicDto = ShowFieldLogicDto | PreventSubmitLogicDto

export type LogicableField =
  | BasicField.Dropdown
  | BasicField.Radio
  | BasicField.YesNo
  | BasicField.Number
  | BasicField.Decimal
  | BasicField.Rating

type LogicAssociation<
  K extends LogicableField,
  VS extends LogicConditionState,
> = [K, Array<VS>]

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
